"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
// Removed Zustand import as it's no longer needed for auth check here
// import { useCustomerStore } from "@/lib/store/customer-store"
import { Header } from "@/components/ui/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
// import { Separator } from "@/components/ui/separator"; // Removed unused import
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// import { Skeleton } from "@/components/ui/skeleton"; // Removed unused import
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, InfoIcon, CheckCircle2 } from "lucide-react" // Removed unused AlertTriangle
import type { Subscription } from "@/lib/types"; // Import renamed Subscription

// Exporting the type for use in the server component page
export type { Subscription };

interface SubscriptionFeature {
  name: string
  value: string
  used?: number | null
  limit?: number | null
  percentage?: number | null
}

interface CustomerDashboardContentProps {
  customerId: string;
  initialSubscriptions: Subscription[]; // Use renamed Subscription
}

export function CustomerDashboardContent({ customerId, initialSubscriptions }: CustomerDashboardContentProps) {
  const router = useRouter()
  // Removed customer state access
  // const { customer } = useCustomerStore()
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null)
  const [features, setFeatures] = useState<SubscriptionFeature[]>([])
  // Removed isHydrated state
  // const [isHydrated, setIsHydrated] = useState(false)

  // Removed hydration state effect
  // useEffect(() => {
  //   setIsHydrated(true)
  // }, [])

  // Determine active subscription and features based on initial data
  useEffect(() => {
    if (initialSubscriptions.length > 0) {
      const active = initialSubscriptions.find(sub => sub.status === "active")
      const currentSub = active || initialSubscriptions[0] // Fallback to first if no active
      setActiveSubscription(currentSub)

      // Mock features based on the determined active/current subscription
      if (currentSub) {
        // TODO: Replace with actual feature/entitlement logic based on plan_id or other data
        const mockFeatures = [
          { name: "API Requests", value: "5,000/month", used: 1250, limit: 5000, percentage: 25 },
          { name: "Storage", value: "50 GB", used: 15, limit: 50, percentage: 30 },
          { name: "Users", value: "10 team members", used: 4, limit: 10, percentage: 40 },
          { name: "Projects", value: "Unlimited", used: 12, limit: null, percentage: null },
          { name: "Support", value: "Priority", used: null, limit: null, percentage: null },
        ]
        setFeatures(mockFeatures)
      }
    } else {
      setActiveSubscription(null) // No subscriptions
      setFeatures([])
    }
  }, [initialSubscriptions])

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

  // Removed hydration/customer checks - rely on Server Component redirect for invalid IDs
  // if (!isHydrated) {
  //   return <div className="p-8 text-center">Loading...</div>
  // }
  // 
  // if (!customer) {
  //   return <div className="p-8 text-center">Verifying session...</div>
  // }

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
            {/* REMOVED Back to Home Button
            <Button 
              variant="outline" 
              size="sm" 
              className="mb-2"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            */}
            <h1 className="text-3xl font-bold tracking-tight">Subscription Dashboard</h1>
            {/* Displaying Customer ID as name might not be available without Zustand state */}
            <p className="text-muted-foreground">
              Manage your subscription and view your usage for Customer ID: {customerId}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              Customer ID: {customerId}
            </Badge>
          </div>
        </div>
        
        {initialSubscriptions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Subscriptions Found</CardTitle>
              <CardDescription>
                Customer {customerId} doesn&apos;t have any active subscriptions yet.
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
              <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      Subscription Details
                      {activeSubscription && (
                        <Badge className={`ml-2 ${getStatusColor(activeSubscription.status)}`}>
                          {activeSubscription.status}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Information about the primary subscription for {customerId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeSubscription ? (
                      <dl className="space-y-4 text-sm">
                        <div className="flex justify-between">
                          <dt className="font-medium text-gray-500">Plan ID</dt>
                          <dd>{activeSubscription.plan_id}</dd>
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
                          <dt className="font-medium text-gray-500">Current Period Ends</dt>
                          <dd>{formatDate(activeSubscription.current_period_end)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium text-gray-500">Subscription ID</dt>
                          <dd className="font-mono">{activeSubscription.id}</dd>
                        </div>
                      </dl>
                    ) : (
                      <p>No active subscription found for {customerId}.</p>
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
                    <CardTitle>Entitlements (Mock)</CardTitle>
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
                  <CardTitle>Usage & Limits (Mock)</CardTitle>
                  <CardDescription>
                    Monitor your resource usage against your plan limits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {features.some(f => f.limit !== null) ? (
                    <div className="space-y-6">
                      {features.filter(f => f.limit !== null).map((feature, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{feature.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {feature.used ?? 'N/A'} / {feature.limit} ({feature.percentage ?? 'N/A'}%)
                            </span>
                          </div>
                          <Progress value={feature.percentage ?? 0} className="h-2" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No usage data with limits available for this plan.</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>Usage Information</AlertTitle>
                    <AlertDescription>
                      Usage data may be delayed. Last mock update: {new Date().toLocaleDateString()}.
                    </AlertDescription>
                  </Alert>
                </CardFooter>
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