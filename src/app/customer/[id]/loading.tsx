import { Header } from "@/components/ui/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";

export default function Loading() {
  return (
    <>
      <Header /> 
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          {/* Title Skeleton - Adjust height/width if needed */} 
          <Skeleton className="h-8 w-3/4 mb-2" /> 
        </div>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
             {/* Tab Trigger Skeletons - Check height/width/spacing */} 
             <Skeleton className="h-10 w-24 mr-2 rounded-md" />
             <Skeleton className="h-10 w-24 mr-2 rounded-md" />
             <Skeleton className="h-10 w-24 rounded-md" />
          </TabsList>
          <TabsContent value="overview" className="mt-6"> {/* Match default TabsContent margin */} 
             <div className="grid gap-6 md:grid-cols-2">
               {/* Subscription Details Card Skeleton */}
               <Card>
                  <CardHeader>
                    {/* Match title size/spacing */}
                    <Skeleton className="h-6 w-1/2 mb-1" /> {/* CardTitle */} 
                    <Skeleton className="h-4 w-3/4" /> {/* CardDescription */} 
                  </CardHeader>
                  {/* Match CardContent padding and internal spacing (e.g., space-y-4) */}
                  <CardContent className="space-y-4">
                    {/* Simulate the dl list items - Match height/spacing */}
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" /> {/* Slightly varied width */} 
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" /> {/* Slightly varied width */} 
                    <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-1/2" /> {/* ID might be shorter */} 
                  </CardContent>
                  <CardFooter>
                     {/* Match Button height */} 
                     <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
                {/* Entitlements Card Skeleton */} 
                <Card>
                  <CardHeader>
                    {/* Match title size/spacing */} 
                    <Skeleton className="h-6 w-1/3 mb-1" /> {/* CardTitle */} 
                    <Skeleton className="h-4 w-2/3" /> {/* CardDescription */} 
                  </CardHeader>
                   {/* Match CardContent padding and internal spacing (e.g., space-y-4) */} 
                  <CardContent className="space-y-4">
                     {/* Simulate the ul list items - Match height/spacing */} 
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                    {/* Add more lines if the real card typically has more features */}
                  </CardContent>
                  {/* No CardFooter skeleton needed if original doesn't have one */}
                </Card>
             </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
