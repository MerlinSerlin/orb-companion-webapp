import React, { useState, useMemo } from 'react';
import type { Subscription } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CreditCard, ArrowUp, Info, X } from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";
import { COMPANY_PLAN_CONFIGS_MAP } from "@/lib/plans/data";
import { PlanUpgradeDialog } from "../dialogs/plan-upgrade-dialog";
import { UnschedulePlanChangeDialog } from "../dialogs/unschedule-plan-change-dialog";
import { useCustomerStore } from "@/lib/store/customer-store";

interface SubscriptionDetailsCardProps {
  subscription?: Subscription | null;
  companyKey?: string;
  onUpgradeSuccess?: () => void;
}

export function SubscriptionDetailsCard({ subscription, companyKey, onUpgradeSuccess }: SubscriptionDetailsCardProps) {
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [isUnscheduleDialogOpen, setIsUnscheduleDialogOpen] = useState(false);
  const getScheduledPlanChange = useCustomerStore(state => state.getScheduledPlanChange);
  const removeScheduledPlanChange = useCustomerStore(state => state.removeScheduledPlanChange);

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

  // Check if there's a scheduled plan change from the store
  const rawScheduledPlanChange = subscription?.id ? getScheduledPlanChange(subscription.id) : null;
  
  // Clean up completed scheduled plan changes
  const scheduledPlanChange = useMemo(() => {
    if (!subscription) {
      return null;
    }
    
    const rawScheduledPlanChange = getScheduledPlanChange(subscription.id);
    
    if (!rawScheduledPlanChange) {
      return null;
    }

    // Check if the scheduled plan change has already been completed
    if (!subscription.plan?.id) {
      console.log('Scheduled plan change exists but subscription plan ID is missing');
      return rawScheduledPlanChange;
    }

    if (subscription.plan.id === rawScheduledPlanChange.targetPlanId) {
      console.log('Scheduled plan change completed - cleaning up stale data', {
        currentPlanId: subscription.plan.id,
        targetPlanId: rawScheduledPlanChange.targetPlanId
      });
      // Clean up the completed scheduled plan change
      removeScheduledPlanChange(subscription.id);
      return null;
    }

    console.log('Scheduled plan change still pending', {
      currentPlanId: subscription.plan.id,
      targetPlanId: rawScheduledPlanChange.targetPlanId
    });

    return rawScheduledPlanChange;
  }, [subscription, getScheduledPlanChange, removeScheduledPlanChange]);

  // Get the target plan name for scheduled change
  const targetPlanName = React.useMemo(() => {
    if (!scheduledPlanChange || !companyKey) return null;
    
    const companyConfig = COMPANY_PLAN_CONFIGS_MAP[companyKey];
    if (!companyConfig) return null;

    const targetPlan = companyConfig.uiPlans.find(plan => 
      plan.plan_id === scheduledPlanChange.targetPlanId
    );

    return targetPlan?.name || scheduledPlanChange.targetPlanName;
  }, [scheduledPlanChange, companyKey]);

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

              {/* Scheduled Plan Change Notification */}
              {scheduledPlanChange && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900">
                      Scheduled Plan Change
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Your plan will be upgraded to <strong>{targetPlanName}</strong> on{' '}
                      <strong>{scheduledPlanChange.changeDate ? formatDate(scheduledPlanChange.changeDate) : 'TBD'}</strong>
                      {scheduledPlanChange.changeOption === 'immediate' && ' (immediate)'}
                      {scheduledPlanChange.changeOption === 'requested_date' && ' (on requested date)'}
                      {scheduledPlanChange.changeOption === 'end_of_subscription_term' && ' (at end of current term)'}
                    </p>
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
          {scheduledPlanChange ? (
            <Button 
              onClick={() => setIsUnscheduleDialogOpen(true)}
              className="w-full"
              variant="outline"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Scheduled Upgrade
            </Button>
          ) : upgradeDetails ? (
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
      {upgradeDetails && subscription && !scheduledPlanChange && (
        <PlanUpgradeDialog
          open={isUpgradeDialogOpen}
          onOpenChange={setIsUpgradeDialogOpen}
          currentPlan={upgradeDetails.currentPlan}
          targetPlan={upgradeDetails.targetPlan}
          subscription={subscription}
          onUpgradeSuccess={onUpgradeSuccess}
        />
      )}

      {/* Unschedule Plan Change Dialog */}
      {scheduledPlanChange && subscription && (
        <UnschedulePlanChangeDialog
          open={isUnscheduleDialogOpen}
          onOpenChange={setIsUnscheduleDialogOpen}
          subscriptionId={subscription.id}
          scheduledChange={scheduledPlanChange}
          onUnscheduleSuccess={onUpgradeSuccess}
        />
      )}
    </>
  );
} 