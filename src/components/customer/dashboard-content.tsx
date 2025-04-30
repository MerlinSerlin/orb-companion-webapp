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
import { PLAN_DETAILS } from "@/components/plans/plan-data";


// Exporting the type for use in the server component page
export type { Subscription };

interface CustomerDashboardContentProps {
  customerId: string; // ID from URL Prop
}

export function CustomerDashboardContent({ customerId: customerIdProp }: CustomerDashboardContentProps) {
  const router = useRouter()
  
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
    return subscriptions.find(sub => sub.status === "active") || subscriptions[0];
  }, [subscriptions]);

  const features = useMemo(() => {
    if (!activeSubscription) return [];
    const matchingPlan = PLAN_DETAILS.find(plan => plan.plan_id === activeSubscription.plan_id);
    return matchingPlan?.features || [];
  }, [activeSubscription]);

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscription Dashboard</h1>
          </div>
        </div>
        
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
                          <dd>{activeSubscription.planName || activeSubscription.plan_id}</dd>
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
                          <li key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                              <span>{feature.name}</span>
                            </div>
                            <Badge variant="secondary">{feature.value}</Badge>
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
                  <CardTitle>Usage</CardTitle>
                  <CardDescription>
                    Overview of included features based on your plan.
                    {/* Usage details are currently based on PLAN_DETAILS, not live data. */}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {features.length > 0 ? (
                    features.map((feature, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{feature.name}</span>
                          <span className="text-sm text-muted-foreground">{feature.value}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No feature details available for this plan.</p>
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
    </>
  )
} 