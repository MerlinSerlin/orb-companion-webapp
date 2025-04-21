import { Suspense } from "react"
import { notFound } from 'next/navigation'
import { CustomerDashboardContent } from "@/components/customer/dashboard-content"
import { getCustomerSubscriptions } from "@/app/actions"
import type { Subscription } from "@/lib/types"

// Removed named re-export of the client component
// export { CustomerDashboardContent }; 

// Define a simple loading skeleton component
function DashboardLoadingSkeleton() {
  // Using a simple text loader for now, could be enhanced with Skeleton components
  return <div className="p-8 text-center">Loading dashboard...</div>;
}

// Define the expected shape of the params object
// interface CustomerDashboardPageParams {
//   id: string;
// }

// Reverted prop type to simpler form expected by Next.js for dynamic routes
export default async function CustomerDashboardPage({ params }: { params: { id: string } }) {

  // Await params before accessing properties for future compatibility
  // Although params might not be a true Promise in this page context currently,
  // awaiting handles potential future changes or edge cases.
  // https://nextjs.org/docs/messages/sync-dynamic-apis
  const awaitedParams = await params;
  const customerId = awaitedParams.id;
  
  // Fetch subscriptions server-side
  const subscriptionResult = await getCustomerSubscriptions(customerId)

  // Handle errors or cases where the customer/subscriptions can't be fetched
  if (!subscriptionResult.success) {
    console.error("Failed to fetch subscriptions for customer:", customerId, subscriptionResult.error);
    // Trigger the 404 page if the customer ID is invalid or API fails
    notFound(); 
  }

  // Type assertion is now safe as the action returns the correct type or null
  const subscriptions: Subscription[] = subscriptionResult.subscriptions || [];
  
  // Note: We intentionally DO NOT call notFound() if subscriptions is empty.
  // An empty array means the customer ID was valid in Orb, but they have no subscriptions.
  // We'll handle displaying that state in the CustomerDashboardContent component.
  
  return (
    <Suspense fallback={<DashboardLoadingSkeleton />}>
      {/* Pass fetched subscriptions directly to the client component */}
      <CustomerDashboardContent customerId={customerId} initialSubscriptions={subscriptions} />
    </Suspense>
  )
} 