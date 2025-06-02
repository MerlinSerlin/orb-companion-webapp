import React from 'react';
import type { Subscription } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, getStatusColor } from "@/lib/utils/formatters";

interface SubscriptionDetailsCardProps {
  activeSubscription: Subscription | null;
  customerId: string;
}

export function SubscriptionDetailsCard({ activeSubscription, customerId }: SubscriptionDetailsCardProps) {
  // JSX for the card will go here
  return (
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
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Plan Name</dt>
              <dd className="h-4 bg-muted rounded animate-pulse w-24"></dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Status</dt>
              <dd className="h-6 bg-muted rounded animate-pulse w-16"></dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Start Date</dt>
              <dd className="h-4 bg-muted rounded animate-pulse w-20"></dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Current Period Starts</dt>
              <dd className="h-4 bg-muted rounded animate-pulse w-20"></dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Current Period Ends</dt>
              <dd className="h-4 bg-muted rounded animate-pulse w-20"></dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Subscription ID</dt>
              <dd className="h-4 bg-muted rounded animate-pulse w-32 font-mono"></dd>
            </div>
          </dl>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" disabled>
          Manage Subscription (Coming Soon)
        </Button>
      </CardFooter>
    </Card>
  );
} 