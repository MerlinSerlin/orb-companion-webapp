import { Suspense } from "react"
import { notFound } from 'next/navigation'
// Import React Query client and hydration components
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query' 
import { CustomerDashboardContent } from "@/components/customer-dashboard/dashboard-content"
// Import both server actions
import { getCustomerSubscriptions, getCustomerDetails } from "@/app/actions/orb"
// Define a simple loading skeleton component

function DashboardLoadingSkeleton() {
  // Using a simple text loader for now, could be enhanced with Skeleton components
  return <div className="p-8 text-center">Loading dashboard...</div>;
}

// Explicitly type params as a Promise in the function signature
export default async function CustomerDashboardPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {

  // Await params before accessing properties for future compatibility
  // Although params might not be a true Promise in this page context currently,
  // awaiting handles potential future changes or edge cases.
  // https://nextjs.org/docs/messages/sync-dynamic-apis
  const awaitedParams = await params;
  const customerId = awaitedParams.id;
  
  // Create a new QueryClient instance for prefetching
  const queryClient = new QueryClient();

  // Prefetch both subscriptions and customer details
  await queryClient.prefetchQuery({
    queryKey: ['subscriptions', customerId],
    queryFn: async () => {
      const result = await getCustomerSubscriptions(customerId);
      if (!result.success) {
        // Handle error appropriately, maybe throw to trigger error boundary or notFound
        console.error("Prefetch failed for subscriptions:", result.error);
        notFound(); // Or throw new Error(result.error)
      }
      return result.subscriptions || []; // Return the data part
    },
  });

  await queryClient.prefetchQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const result = await getCustomerDetails(customerId);
      if (!result.success) {
        console.error("Prefetch failed for customer details:", result.error);
        notFound(); // Or throw new Error(result.error)
      }
      return result.customer; // Return the data part
    },
  });
  
  return (
    // Pass the dehydrated cache state to the boundary
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<DashboardLoadingSkeleton />}>
        {/* Pass only the customerId needed for query keys in client components */}
        <CustomerDashboardContent customerId={customerId} />
      </Suspense>
    </HydrationBoundary>
  )
} 

export const dynamic = 'force-dynamic' 