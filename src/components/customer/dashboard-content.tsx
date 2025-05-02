"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from '@tanstack/react-query'
import { useCustomerStore } from "@/lib/store/customer-store"
import { getCustomerDetails } from "@/app/actions"
import { Header } from "@/components/ui/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, AlertCircle } from "lucide-react"
import type { Subscription, CustomerDetails } from "@/lib/types";
import { AddOnDialog } from "@/components/dialogs/add-on-dialog";
import React from "react";

// Helper function to format large numbers
const formatNumber = (num: number | string): string => {
  const numericValue = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numericValue)) return String(num); // Return original if not a number

  if (numericValue >= 1e12) { // Trillions
    return (numericValue / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
  }
  if (numericValue >= 1e9) { // Billions
    return (numericValue / 1e9).toFixed(1).replace(/\.0$/, '') + 'G';
  }
  if (numericValue >= 1e6) { // Millions
    return (numericValue / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (numericValue >= 1e3) { // Thousands
    // Optional: Abbreviate thousands? e.g., 5000 -> 5K
    // return (numericValue / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    // Or keep them as is for clarity below millions
    return numericValue.toLocaleString(); // Add commas for thousands
  }
  // For numbers less than 1000, return as is (or maybe format decimals if needed)
  // Using toFixed(1) and removing .0 for consistency with abbreviations
  if (numericValue % 1 !== 0) { // Check if it has decimals
     return parseFloat(numericValue.toFixed(1)).toString(); // Format to 1 decimal place
  }
  return numericValue.toString();
};

// Exporting the type for use in the server component page
export type { Subscription };

interface CustomerDashboardContentProps {
  customerId: string; // ID from URL Prop
}

export function CustomerDashboardContent({ customerId: customerIdProp }: CustomerDashboardContentProps) {
  const router = useRouter()
  
  // --- State for Dialog --- 
  const [isAddOnDialogOpen, setIsAddOnDialogOpen] = React.useState(false);

  // --- React Query Hooks --- (Customer Details defined before useEffect)
  const { 
    data: customerDetails, 
    error: customerDetailsError 
  } = useQuery<CustomerDetails | null, Error>({
    queryKey: ['customer', customerIdProp],
    queryFn: async () => {
      // console.warn('Client-side customer details fetch executed...'); // Optional log
      const result = await getCustomerDetails(customerIdProp); 
      if (!result.success || !result.customer) { 
        console.error('Failed to fetch customer details in queryFn:', result.error);
        return null;
      }
      return result.customer; 
    },
    staleTime: Infinity, 
    enabled: !!customerIdProp
  });

  // Effect to sync Zustand store context using the result of the customer details query
  useEffect(() => {
    // Get store state directly inside the effect
    const { customerId: currentStoreCustomerId, setCustomerId, setExternalCustomerId } = useCustomerStore.getState();
    
    console.log('[Dashboard Context Sync] Effect triggered. Fetched Details:', customerDetails);

    // Check if query has successfully fetched data AND if the fetched ID differs from the store ID
    if (customerDetails && customerDetails.id !== currentStoreCustomerId) {
      console.log(`[Dashboard Context Sync] Fetched customer ID (${customerDetails.id}) differs from store ID (${currentStoreCustomerId}). Updating store.`);
      setCustomerId(customerDetails.id);
      setExternalCustomerId(customerDetails.external_customer_id);
    }
    // No fetch needed here anymore, query hook handles it.
    // No cleanup needed for fetch, but effect still runs on dependency change.

  // Depend on the fetched customerDetails object
  }, [customerDetails]); 

  // --- Subscriptions Query ---
  const { 
    data: subscriptions, 
    error: subscriptionsError 
  } = useQuery<Subscription[], Error>({
    queryKey: ['subscriptions', customerIdProp],
    queryFn: async () => { 
        // console.warn('Client-side subscription fetch executed...'); // Optional log
        // For now, assume hydration or handle client fetch if necessary
        return []; 
    },
    staleTime: 5 * 60 * 1000, 
    enabled: !!customerIdProp
  });

  // --- Calculate derived state directly during render ---
  const activeSubscription = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return null;
    // Prioritize active, but might need logic for multiple active subs if possible
    return subscriptions.find(sub => sub.status === "active") || subscriptions[0];
  }, [subscriptions]);

  // Derive features/entitlements from the active subscription's price intervals
  const features = useMemo(() => {
    if (!activeSubscription?.price_intervals) return [];

    // Update structure to hold separate base and overage values
    const entitlementFeatures: { 
      name: string; 
      baseValue: string; 
      overageInfo?: string; 
      rawQuantity?: number; 
      rawOveragePrice?: number; // Add raw overage price field
    }[] = [];

    activeSubscription.price_intervals.forEach(interval => {
      const price = interval.price;
      if (!price || !price.item || price.item.name === "Platform Fee") { 
        return; // Skip Platform Fee
      }

      // --- Remove Debug Logging START ---
      /*
      if (price?.item?.name?.includes('Builds')) { // Log specifically for Builds/Concurrent Builds
        console.log('[DEBUG] Processing Builds interval:', JSON.stringify(interval, null, 2));
        // Log the specific fields used in the Unlimited check
        if (price.price_type === 'usage_price' && price.model_type === 'tiered' && price.tiered_config?.tiers?.[0]) {
          const firstTier = price.tiered_config.tiers[0];
          console.log('[DEBUG] Builds First Tier Details:', {
            last_unit: firstTier.last_unit,
            first_unit: firstTier.first_unit,
            unit_amount: firstTier.unit_amount,
            isZeroCostCheck: firstTier.unit_amount == null || firstTier.unit_amount === '0' || firstTier.unit_amount === '0.00'
          });
        }
      }
      */
      // --- Remove Debug Logging END ---

      let baseValue = "Included"; // Default base value
      let overageInfo: string | undefined = undefined; // Overage info
      let rawQuantity: number | undefined = undefined; // Raw quantity
      let rawOveragePrice: number | undefined = undefined; // Add variable
      const currencySymbol = price.currency === 'USD' ? '$' : ''; 

      if (price.price_type === 'fixed_price' && typeof price.fixed_price_quantity === 'number') {
         rawQuantity = price.fixed_price_quantity; // Store raw quantity
         baseValue = formatNumber(price.fixed_price_quantity); // Apply formatting cautiously
         // Check for overage tier for fixed price items too (like concurrent builds)
         if (price.model_type === 'tiered' && price.tiered_config?.tiers && price.tiered_config.tiers.length > 1) {
             const overageTier = price.tiered_config.tiers[1];
             if (overageTier && overageTier.unit_amount && parseFloat(overageTier.unit_amount) > 0) {
                // Determine unit if possible (might be just 'additional unit')
                let perUnit = 'additional unit'; 
                if (price.item.name.includes('Build')) perUnit = 'build';
                // Format the overage amount as well
                const overageAmount = parseFloat(overageTier.unit_amount);
                rawOveragePrice = overageAmount; // Store raw overage price
                const formattedOverageAmount = overageAmount.toFixed(2);
                overageInfo = `(then ${currencySymbol}${formattedOverageAmount}/${perUnit})`;
             }
         }
      } else if (price.price_type === 'usage_price' && price.model_type === 'tiered' && price.tiered_config?.tiers) {
         const tiers = price.tiered_config.tiers;
         const firstTier = tiers[0];
         
         if (firstTier) { 
             // Check for ZERO COST / UNLIMITED condition FIRST
             const isZeroCost = firstTier.unit_amount == null || firstTier.unit_amount === '0' || firstTier.unit_amount === '0.00';
             if (firstTier.last_unit === null && firstTier.first_unit === 0 && isZeroCost) { 
                // Keep baseValue as default "Included" (or derive if necessary, but Included is likely correct)
                overageInfo = 'Unlimited'; // Set the description/overage text to Unlimited
             }
             // Determine included amount from first tier (if not unlimited)
             else if (firstTier.last_unit !== null && firstTier.last_unit !== undefined && firstTier.last_unit > 0) { 
                const amount = firstTier.last_unit; // Use raw number for formatting
                rawQuantity = amount; // Store raw usage quantity
                let unit = '';
                if (price.item.name.includes('GB')) unit = ' GB';
                if (price.item.name.includes('Minutes')) unit = ' minutes';
                if (price.item.name.includes('Request')) unit = ' requests';
                // Apply number formatting here
                baseValue = `${formatNumber(amount)}${unit}`;
             }
             
             // Determine overage from the next tier(s) ONLY IF NOT UNLIMITED
             if (baseValue !== 'Unlimited' && tiers.length > 1) {
                const overageTier = tiers[1];
                if (overageTier && overageTier.unit_amount && parseFloat(overageTier.unit_amount) > 0) {
                    let perUnit = '';
                    if (price.item.name.includes('GB')) perUnit = 'GB';
                    if (price.item.name.includes('Minutes')) perUnit = 'minute';
                    if (price.item.name.includes('Request')) perUnit = 'request';
                    // Format the overage amount (consider very small amounts)
                    const overageAmount = parseFloat(overageTier.unit_amount);
                    rawOveragePrice = overageAmount; // Store raw overage price
                    // Use standard decimal format for small fractions (< 0.01), toFixed(2) otherwise
                    let formattedOverageAmount;
                    if (overageAmount < 0.01 && overageAmount > 0) {
                        formattedOverageAmount = overageAmount.toString(); // Use standard string representation for small decimals
                        // Or potentially use toFixed() with more places if needed: e.g., overageAmount.toFixed(4)
                    } else { // For amounts >= 0.01 or exactly 0
                        formattedOverageAmount = overageAmount.toFixed(2); 
                    }
                    overageInfo = `(then ${currencySymbol}${formattedOverageAmount}${perUnit ? `/${perUnit}` : ''})`;
                }
             }
         }
      } 
      // --- Add check for Unit-based Usage Price --- 
      else if (price.price_type === 'usage_price' && price.model_type === 'unit') {
         // Check if the unit price is zero, indicating unlimited usage for this model type
         const unitAmount = price.unit_config?.unit_amount;
         const isZeroCostUnit = unitAmount == null || unitAmount === '0' || unitAmount === '0.00';
         if (isZeroCostUnit) {
           // Keep baseValue as "Included"
           overageInfo = 'Unlimited'; 
         } else {
           // Handle non-zero unit-based usage prices if necessary (e.g., display per-unit cost)
           // For now, we assume non-zero unit prices might not appear or don't need special handling
         }
      } 
      // --- End check for Unit-based Usage Price ---

      const displayName = price.item.name.replace(/^Nimbus Scale\s+/, '');

      entitlementFeatures.push({
        name: displayName, 
        baseValue: baseValue, // Store base value
        overageInfo: overageInfo, // Store overage info (optional)
        rawQuantity: rawQuantity, // Include raw quantity
        rawOveragePrice: rawOveragePrice, // Include raw overage price
      });
    });

    // Move "Concurrent Builds" to the end if it exists
    const concurrentBuildsIndex = entitlementFeatures.findIndex(feat => feat.name === 'Concurrent Builds');
    if (concurrentBuildsIndex > -1) {
      // Remove the item from its current position
      const [concurrentBuildsFeature] = entitlementFeatures.splice(concurrentBuildsIndex, 1);
      // Add it to the end
      entitlementFeatures.push(concurrentBuildsFeature);
    }

    // Optional: Sort remaining features alphabetically? (If desired)
    // entitlementFeatures.sort((a, b) => a.name.localeCompare(b.name)); 

    return entitlementFeatures;

  }, [activeSubscription]);

  // --- Find Concurrent Builds data for Dialog --- 
  const concurrentBuildsFeatureData = useMemo(() => { 
      return features.find(f => f.name === 'Concurrent Builds');
  }, [features]);

  // --- Render Logic --- 

  // Handle combined errors (simplified example)
  const combinedError = subscriptionsError || customerDetailsError;
  if (combinedError) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>
            {combinedError.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
  
  const getStatusColor = (status: Subscription['status'] | undefined): string => {
    switch (status) {
      case "active": return "bg-green-500";
      case "canceled": return "bg-red-500";
      case "ended": return "bg-gray-500";
      case "pending": return "bg-yellow-500";
      case "upcoming": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Use fetched subscriptions data */}
        {!subscriptions || subscriptions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Subscriptions Found</CardTitle>
              <CardDescription>
                {/* Display internal ID from prop since external ID isn't here anymore */}
                Customer {customerIdProp} doesn&apos;t have any active subscriptions yet.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => router.push("/")}>
                Browse Plans
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      Subscription Details
                      {/* Use derived activeSubscription state */}
                      {activeSubscription && (
                        <Badge className={`ml-2 ${getStatusColor(activeSubscription.status)}`}>
                          {activeSubscription.status}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {/* Display internal ID from prop */}
                      Information about the primary subscription for {customerIdProp}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Use derived activeSubscription state */}
                    {activeSubscription ? (
                      <dl className="space-y-4 text-sm">
                        <div className="flex justify-between">
                          <dt className="font-medium text-gray-500">Plan Name</dt>
                          <dd>{activeSubscription.plan?.name || activeSubscription.plan?.id || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium text-gray-500">Status</dt>
                          <dd>
                            <Badge variant="outline">
                              {activeSubscription.status}
                            </Badge>
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium text-gray-500">Start Date</dt>
                          <dd>{formatDate(activeSubscription.start_date)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium text-gray-500">Current Period Starts</dt>
                          <dd>{formatDate(activeSubscription.current_period_start)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium text-gray-500">Current Period Ends</dt>
                          <dd>{formatDate(activeSubscription.current_period_end)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium text-gray-500">Subscription ID</dt>
                          <dd className="font-mono">{activeSubscription.id}</dd>
                        </div>
                      </dl>
                    ) : (
                      <p>Processing subscription details...</p> 
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" disabled>
                      Manage Subscription (Coming Soon)
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Entitlements</CardTitle>
                    <CardDescription>
                      Features included in the current plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {features.length > 0 ? (
                      <ul className="space-y-4">
                        {features.map((feature, index) => (
                          <li key={index} className="flex items-start justify-between border-b pb-3 pt-1 last:border-b-0 text-sm">
                            {/* Left side: Icon, Name */}
                            <div className="flex items-center pt-0.5">
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                              <span className="font-medium">{feature.name}</span> {/* Removed margin */}
                              {/* Button removed from here */}
                            </div>

                            {/* Right side: Base Value, Overage, and Conditional Button */}
                            <div className="flex flex-col items-end text-right space-y-0.5">
                              <span className="font-medium">{feature.baseValue}</span>
                              {feature.overageInfo && (
                                <span className="text-xs text-muted-foreground">
                                  {feature.overageInfo}
                                </span>
                              )}
                              {/* Conditionally add button for Concurrent Builds below overage */}
                              {feature.name === 'Concurrent Builds' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="mt-1 h-6 px-2" // Added margin-top back
                                  onClick={() => setIsAddOnDialogOpen(true)}
                                >
                                  Add
                                </Button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No feature details available for this plan.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="usage">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Portal</CardTitle>
                  <CardDescription>
                    Manage billing details and payment methods directly via the portal.
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-4">
                  {customerDetails?.portal_url ? (
                    <iframe
                      src={customerDetails.portal_url}
                      title="Customer Portal"
                      className="w-full h-[600px] border rounded-md"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                       Portal URL not available for this customer.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="billing">
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>
                    View your past and upcoming invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableCaption>A list of your recent invoices.</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Billing history coming soon.
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* --- Render the Add-On Dialog --- */} 
      <AddOnDialog 
        open={isAddOnDialogOpen}
        onOpenChange={setIsAddOnDialogOpen}
        itemName="Concurrent Build" 
        currentQuantity={concurrentBuildsFeatureData?.rawQuantity ?? 0}
        addOnPrice={concurrentBuildsFeatureData?.rawOveragePrice ?? 0} 
        onConfirm={(details) => {
          const { quantityToAdd, effectiveDate } = details;
          console.log('[AddOnDialog] Confirmed:', { quantityToAdd, effectiveDate });
          // TODO: Implement API call/mutation
          setIsAddOnDialogOpen(false); 
        }}
      />
    </>
  )
} 