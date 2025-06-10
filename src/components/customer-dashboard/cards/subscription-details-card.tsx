import React, { useState } from 'react';
import type { Subscription } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CreditCard, ArrowUp } from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";
import { COMPANY_PLAN_CONFIGS_MAP } from "@/lib/plans/data";
import { PlanUpgradeDialog } from "../dialogs/plan-upgrade-dialog";

interface SubscriptionDetailsCardProps {
  subscription?: Subscription | null;
  companyKey?: string;
  onUpgradeSuccess?: () => void;
}

export function SubscriptionDetailsCard({ subscription, companyKey, onUpgradeSuccess }: SubscriptionDetailsCardProps) {
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

  const getBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'canceled':
        return 'destructive';
      case 'ended':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get upgrade details if available
  const upgradeDetails = React.useMemo(() => {
    if (!subscription || !companyKey) return null;
    
    const companyConfig = COMPANY_PLAN_CONFIGS_MAP[companyKey];
    if (!companyConfig) return null;

    const currentPlan = companyConfig.uiPlans.find(plan => 
      plan.plan_id === subscription.plan?.id
    );
    
    if (!currentPlan?.allowedPlanUpgradeID) return null;

    const targetPlan = companyConfig.uiPlans.find(plan => 
      plan.plan_id === currentPlan.allowedPlanUpgradeID
    );

    if (!targetPlan) return null;

    return {
      currentPlan: {
        id: subscription.plan?.id || '',
        name: currentPlan.name
      },
      targetPlan: {
        id: currentPlan.allowedPlanUpgradeID,
        name: targetPlan.name
      },
      buttonText: `Upgrade to ${targetPlan.name}`
    };
  }, [subscription, companyKey]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Details
          </CardTitle>
          <CardDescription>
            Current plan information and billing details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Plan</div>
                  <div className="text-lg font-semibold">{subscription.plan?.name || 'Unknown Plan'}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Status</div>
                  <Badge variant={getBadgeVariant(subscription.status)}>
                    {subscription.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Start Date</div>
                  <div className="text-sm">{subscription.start_date ? formatDate(subscription.start_date) : 'N/A'}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Subscription ID</div>
                  <div className="text-sm font-mono">{subscription.id}</div>
                </div>
              </div>
              
              {subscription.current_period_start && subscription.current_period_end && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Billing Period
                  </div>
                  <div className="text-sm">
                    {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="h-4 bg-muted animate-pulse rounded"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-2/3"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {upgradeDetails ? (
            <Button 
              onClick={() => setIsUpgradeDialogOpen(true)}
              className="w-full"
              variant="default"
            >
              <ArrowUp className="mr-2 h-4 w-4" />
              {upgradeDetails.buttonText}
            </Button>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              Manage Subscription (Coming Soon)
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Plan Upgrade Dialog */}
      {upgradeDetails && subscription && (
        <PlanUpgradeDialog
          open={isUpgradeDialogOpen}
          onOpenChange={setIsUpgradeDialogOpen}
          currentPlan={upgradeDetails.currentPlan}
          targetPlan={upgradeDetails.targetPlan}
          subscription={subscription}
          onUpgradeSuccess={onUpgradeSuccess}
        />
      )}
    </>
  );
} 