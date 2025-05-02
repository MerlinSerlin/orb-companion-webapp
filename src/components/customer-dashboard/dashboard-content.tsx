"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from '@tanstack/react-query'
import { useCustomerStore } from "@/lib/store/customer-store"
import { getCustomerDetails, getCustomerSubscriptions } from "@/app/actions"
import { Header } from "@/components/ui/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, AlertCircle, Info } from "lucide-react"
import type { Subscription, CustomerDetails } from "@/lib/types";
import { AddOnDialog } from "@/components/dialogs/add-on-dialog";
import { useQueryClient } from '@tanstack/react-query'
import { formatDate, getStatusColor } from "@/lib/utils/formatters";
import { deriveEntitlementsFromSubscription } from "@/lib/utils/subscriptionUtils";

// Exporting the type for use in the server component page
export type { Subscription };

interface CustomerDashboardContentProps {
  customerId: string; // ID from URL Prop
}

export function CustomerDashboardContent({ customerId: customerIdProp }: CustomerDashboardContentProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  // --- State for Dialog --- 
  const [isAddOnDialogOpen, setIsAddOnDialogOpen] = useState(false);

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

  // Add detailed status logging for subscriptions query
  const {
    data: subscriptions,
    error: subscriptionsError,
    isLoading: subscriptionsLoading,
    isError: subscriptionsIsError,
  } = useQuery<Subscription[], Error>({ 
    queryKey: ['subscriptions', customerIdProp],
    queryFn: async () => { 
      const result = await getCustomerSubscriptions(customerIdProp);
      if (!result.success) {
        // Throw error to put query hook in error state
        throw new Error(result.error || 'Failed to fetch subscriptions');
      }
      // Ensure we return an empty array if subscriptions are null/undefined
      return result.subscriptions ?? []; 
    },
    staleTime: 5 * 60 * 1000, 
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

  // --- Calculate derived state directly during render ---
  const activeSubscription = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return null;
    // Prioritize active, but might need logic for multiple active subs if possible
    return subscriptions.find(sub => sub.status === "active") || subscriptions[0];
  }, [subscriptions]);

  // Derive features/entitlements using the abstracted function
  const features = useMemo(() => {
    return deriveEntitlementsFromSubscription(activeSubscription);
  }, [activeSubscription]);

  // --- Find Concurrent Builds data (including priceIntervalId) for Dialog ---
  const concurrentBuildsFeatureData = useMemo(() => {
      // Ensure features includes priceIntervalId
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

  // Prioritize subscription loading/error states for main content display
  if (subscriptionsLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p>Loading subscriptions...</p> {/* Add a loading indicator */}
        </main>
      </>
    );
  }

  if (subscriptionsIsError) { // Check specific error state for subscriptions
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Subscriptions</AlertTitle>
          <AlertDescription>
            {(subscriptionsError as Error)?.message || 'An unknown error occurred'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Original check for no subscriptions *after* loading and error checks
  if (!subscriptions || subscriptions.length === 0) { 
    console.log('[Dashboard Render] Rendering No Subscriptions card.');
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>No Subscriptions Found</CardTitle>
              <CardDescription>
                Customer {customerIdProp} doesn&apos;t have any active subscriptions yet.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => router.push("/")}>
                Browse Plans
              </Button>
            </CardFooter>
          </Card>
        </main>
      </>
    );
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

                            {/* Right side: Value, Overage, Button, Scheduled Change */}
                            <div className="flex flex-col items-end text-right space-y-1"> 
                              <div className="flex flex-col items-end space-y-0.5"> 
                                 {/* Current Quantity (No longer includes scheduled change inline) */}
                                 <span className="font-medium">{feature.baseValue}</span>
                                 {/* Overage Info */}
                                 {feature.overageInfo && (
                                   <span className="text-xs text-muted-foreground">
                                     {feature.overageInfo}
                                   </span>
                                 )}
                              </div>
                              
                              {/* Button */}
                              {feature.name === 'Concurrent Builds' && (
                                <Button 
                                  variant="default"
                                  size="sm"
                                  className="mt-1 h-6 px-2"
                                  onClick={() => setIsAddOnDialogOpen(true)}
                                >
                                  {/* Conditional Button Text (Updated Logic) */}
                                  {feature.scheduledChange || (feature.rawQuantity && feature.rawQuantity > 1) ? 'Adjust' : 'Add'}
                                </Button>
                              )}

                              {/* Scheduled Change Indicator (Moved back here) */}
                              {feature.scheduledChange && (
                                <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mt-1 space-x-1">
                                  <Info className="h-3 w-3 flex-shrink-0" />
                                  <span>
                                    Scheduled change to {feature.scheduledChange.quantity} on {formatDate(feature.scheduledChange.effectiveDate)}
                                  </span>
                                </div>
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
      {activeSubscription && concurrentBuildsFeatureData && concurrentBuildsFeatureData.priceIntervalId && ( // Ensure priceIntervalId exists
        <AddOnDialog
          open={isAddOnDialogOpen}
          onOpenChange={setIsAddOnDialogOpen}
          itemName="Concurrent Build"
          currentQuantity={concurrentBuildsFeatureData.rawQuantity ?? 0}
          addOnPrice={concurrentBuildsFeatureData.rawOveragePrice ?? 0}
          subscriptionId={activeSubscription.id}
          priceIntervalId={concurrentBuildsFeatureData.priceIntervalId} 
          currentPeriodStartDate={activeSubscription.current_period_start} // Pass current period start date
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions', customerIdProp] });
            setIsAddOnDialogOpen(false);
          }}
        />
      )}
    </>
  )
} 