"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useCustomerStore } from "@/lib/store/customer-store"
import { Header } from "@/components/ui/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle } from "lucide-react"
import type { Subscription } from "@/lib/types";
import { AddOnDialog } from "@/components/dialogs/add-on-dialog";
import { useQueryClient } from '@tanstack/react-query'
import { deriveEntitlementsFromSubscription } from "@/lib/utils/subscriptionUtils";
import { useCustomerSubscriptions, useCustomerDetails } from "@/hooks/useCustomerData";
import { SubscriptionDetailsCard } from "./cards/subscription-details-card";
import { EntitlementsCard } from "./cards/entitlements-card";
import { CustomerPortalCard } from "./cards/customer-portal-card";

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

  // Use the custom hook for customer details
  const { 
    data: customerDetails, 
    error: customerDetailsError 
  } = useCustomerDetails(customerIdProp);

  // Use the custom hook for subscriptions
  const {
    data: subscriptions,
    error: subscriptionsError,
    isLoading: subscriptionsLoading,
    isError: subscriptionsIsError,
  } = useCustomerSubscriptions(customerIdProp);

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
                <SubscriptionDetailsCard 
                  activeSubscription={activeSubscription} 
                  customerId={customerIdProp} 
                />
                
                <EntitlementsCard 
                  features={features} 
                  onOpenAddOnDialog={() => setIsAddOnDialogOpen(true)} 
                />
              </div>
            </TabsContent>
            
            <TabsContent value="usage">
              <CustomerPortalCard portalUrl={customerDetails?.portal_url} />
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