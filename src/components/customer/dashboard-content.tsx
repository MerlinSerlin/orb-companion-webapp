"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
// Import useQuery
import { useQuery } from '@tanstack/react-query'
// Import customer store and action
import { useCustomerStore, type CustomerState } from "@/lib/store/customer-store"
import { getCustomerDetails } from "@/app/actions"
// Removed Zustand import as it's no longer needed for auth check here
// import { useCustomerStore } from "@/lib/store/customer-store"
import { Header } from "@/components/ui/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
// import { Progress } from "@/components/ui/progress"
// import { Separator } from "@/components/ui/separator"; // Removed unused import
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// import { Skeleton } from "@/components/ui/skeleton"; // Removed unused import
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { InfoIcon } from "lucide-react"
import { CheckCircle2, AlertCircle } from "lucide-react"
import type { Subscription } from "@/lib/types"; // Import renamed Subscription
// Import PLAN_DETAILS
import { PLAN_DETAILS } from "@/components/plans/plan-data";
// Import the server action (though useQuery won't call it directly here)
// import { getCustomerSubscriptions } from "@/app/actions"

// Exporting the type for use in the server component page
export type { Subscription };

// Use the Feature type from PLAN_DETAILS if possible, or redefine if needed
// Assuming PLAN_DETAILS features have { name: string; value: string; ...? }
interface DisplayFeature {
  name: string;
  value: string;
}

interface CustomerDashboardContentProps {
  customerId: string; // ID from URL Prop
}

export function CustomerDashboardContent({ customerId: customerIdProp }: CustomerDashboardContentProps) {
  const router = useRouter()
  // Access customer store
  const storeCustomerId = useCustomerStore((state: CustomerState) => state.customerId);
  const setStoreCustomerId = useCustomerStore((state: CustomerState) => state.setCustomerId);
  const setStoreExternalCustomerId = useCustomerStore((state: CustomerState) => state.setExternalCustomerId);
  
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null)
  const [features, setFeatures] = useState<DisplayFeature[]>([])

  // Effect to sync Zustand store context with URL customerId
  useEffect(() => {
    let isMounted = true; // Flag to track component mount status
    // Get store state directly inside the effect to avoid dependency loop
    const currentStoreState = useCustomerStore.getState();
    const currentStoreCustomerId = currentStoreState.customerId;
    
    console.log('[Dashboard Context Sync] Effect triggered. URL ID:', customerIdProp);

    // Only fetch if URL ID is present AND it's different from the *current* store ID
    if (customerIdProp && customerIdProp !== currentStoreCustomerId) {
      console.log(`[Dashboard Context Sync] URL ID (${customerIdProp}) differs from store ID (${currentStoreCustomerId}). Fetching details...`);
      const fetchAndSetContext = async () => {
        try {
          const result = await getCustomerDetails(customerIdProp);
          console.log('[Dashboard Context Sync] Fetched details result:', result);
          
          if (isMounted) { 
            if (result.success && result.customer) {
              console.log(`[Dashboard Context Sync] (Mounted) Setting store context: ID=${result.customer.id}, ExternalID=${result.customer.external_customer_id}`);
              // Use setters from the state obtained via getState()
              currentStoreState.setCustomerId(result.customer.id);
              currentStoreState.setExternalCustomerId(result.customer.external_customer_id);
            } else {
              console.error(`[Dashboard Context Sync] (Mounted) Failed to fetch details for ${customerIdProp}:`, result.error);
            }
          } else {
             console.log('[Dashboard Context Sync] (Unmounted) Fetch completed, but component unmounted. Skipping store update.');
          }
        } catch (error) {
            if (isMounted) {
                console.error(`[Dashboard Context Sync] (Mounted) Error during fetch for ${customerIdProp}:`, error);
            }
        }
      };
      fetchAndSetContext();
    }
    
    return () => {
      console.log('[Dashboard Context Sync] Cleanup: Component unmounting or URL prop changing.');
      isMounted = false;
    };
  // Only depend on the ID from the URL prop
  }, [customerIdProp]); 

  // Fetch subscriptions using useQuery (using customerIdProp from URL)
  const { data: subscriptions, isLoading: isLoadingSubscriptions, error: subscriptionsError } = useQuery<Subscription[], Error>({
    queryKey: ['subscriptions', customerIdProp],
    queryFn: () => Promise.resolve([]), 
    staleTime: Infinity, 
  });

  // Effect to process subscriptions data once fetched by useQuery
  useEffect(() => {
    // Check if data is loaded and not errored
    if (subscriptions && subscriptions.length > 0) { 
      const active = subscriptions.find(sub => sub.status === "active")
      const currentSub = active || subscriptions[0]
      setActiveSubscription(currentSub)

      if (currentSub) {
        const matchingPlan = PLAN_DETAILS.find(plan => plan.plan_id === currentSub.plan_id);
        setFeatures(matchingPlan?.features || []); 
      } else {
        setFeatures([]);
      }
    } else if (subscriptions) { // Data loaded, but empty array
      setActiveSubscription(null)
      setFeatures([])
    } 
    // Handle loading/error states outside useEffect if preferred
  }, [subscriptions]) // Depend on the data from useQuery

  // Removed the redirect logic effect based on customer/hydration
  // useEffect(() => {
  //   if (!isHydrated) return
  //   
  //   if (!customer) {
  //     const timer = setTimeout(() => {
  //       router.push("/")
  //     }, 500)
  //     return () => clearTimeout(timer)
  //   } else if (customer.id !== customerId) {
  //     router.push("/")
  //   }
  // }, [customer, customerId, router, isHydrated])

  // --- Render Logic --- 

  if (isLoadingSubscriptions) {
    // Can use the skeleton from the server component or a simpler one here
    return <div className="p-8 text-center">Loading dashboard content...</div>;
  }

  if (subscriptionsError) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load subscription data: {subscriptionsError.message}
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
            {/* REMOVED Back to Home Button */}
            <h1 className="text-3xl font-bold tracking-tight">Subscription Dashboard</h1>
            {/* REMOVED description paragraph */}
            {/* 
            <p className="text-muted-foreground">
              Manage your subscription and view your usage for Customer: {externalCustomerId}
            </p>
             */}
          </div>
          {/* REMOVED badge container div */}
          {/* 
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              Customer ID: {externalCustomerId}
            </Badge>
          </div>
           */}
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