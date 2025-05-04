import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CustomerPortalCardProps {
  portalUrl: string | null | undefined;
}

export function CustomerPortalCard({ portalUrl }: CustomerPortalCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Portal</CardTitle>
        <CardDescription>
          Manage billing details and payment methods directly via the portal.
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-4">
        {portalUrl ? (
          <iframe
            src={portalUrl}
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
  );
} 