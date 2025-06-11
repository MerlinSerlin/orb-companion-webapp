"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useCustomerStore } from "@/lib/store/customer-store"
import { Header } from "@/components/ui/header"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { Subscription } from "@/lib/types";
import type { OrbInstance } from "@/lib/orb-config";
import { ORB_INSTANCES } from "@/lib/orb-config";
import { getCurrentCompanyConfig } from "@/lib/plans";
import { ManageFixedPriceItemDialog } from "./dialogs/manage-fixed-price-item-dialog";
import { AddNewFloatingPriceDialog } from "./dialogs/add-new-floating-price-dialog";
import { CancelFuturePriceIntervalDialog } from "@/components/dialogs/cancel-future-price-interval-dialog";
import { RemoveActiveEntitlementDialog } from "@/components/dialogs/remove-active-entitlement-dialog";
import { useQueryClient } from '@tanstack/react-query'
import { deriveEntitlementsFromSubscription, type EntitlementFeature } from "@/lib/utils/subscriptionUtils";
import { useCustomerSubscriptions, useCustomerDetails } from "@/hooks/useCustomerData";
import { SubscriptionDetailsCard } from "./cards/subscription-details-card";
import { EntitlementsCard } from "./cards/entitlements-card";
import { CustomerPortalCard } from "./cards/customer-portal-card";
import { removeFixedFeeTransition } from "@/app/actions/orb";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/formatters";

// Define the sentinel value that an override item can use to indicate it wants the full dynamic feature
const DYNAMIC_VALUE_SENTINEL = "%%USE_DYNAMIC_VALUE%%";

// Exporting the type for use in the server component page
export type { Subscription };

interface CustomerDashboardContentProps {
  customerId: string; // ID from URL Prop, should be the source of truth post-hydration
  instance?: OrbInstance; // Prop instance, can serve as SSR hint or fallback
}

export function CustomerDashboardContent({ customerId: customerIdProp, instance: instanceProp }: CustomerDashboardContentProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [stableCustomerId, setStableCustomerId] = useState<string | null>(null);
  const [isReadyToFetch, setIsReadyToFetch] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
    if (customerIdProp) {
      setStableCustomerId(customerIdProp);
    }
  }, [customerIdProp]);
  
  const storeSelectedInstance = useCustomerStore((state) => state.selectedInstance);
  const storeCustomerId = useCustomerStore((state) => state.customerId);

  const currentInstance = isClientMounted ? (storeSelectedInstance || instanceProp) : undefined;
  
  // Dialog states
  const [isAdjustFixedPriceDialogOpen, setIsAdjustFixedPriceDialogOpen] = useState(false);
  const [featureToAdjust, setFeatureToAdjust] = useState<EntitlementFeature | null>(null);
  const [addOnToInitiate, setAddOnToInitiate] = useState<{ priceId: string; itemName: string } | null>(null);
  const [isCancelFutureDialogOpen, setIsCancelFutureDialogOpen] = useState(false);
  const [futureIntervalToCancel, setFutureIntervalToCancel] = useState<{ priceIntervalId: string; priceIntervalName: string; currentStartDate: string } | null>(null);
  const [isRemoveActiveDialogOpen, setIsRemoveActiveDialogOpen] = useState(false);
  const [activeIntervalToRemove, setActiveIntervalToRemove] = useState<{ priceIntervalId: string; priceIntervalName: string } | null>(null);

  const { 
    data: customerDetails, 
    error: customerDetailsError,
    isLoading: customerDetailsLoading 
  } = useCustomerDetails(
    stableCustomerId,
    currentInstance
  );

  const {
    data: subscriptions,
    error: subscriptionsError,
    isLoading: subscriptionsLoading,
  } = useCustomerSubscriptions(
    isReadyToFetch ? stableCustomerId : undefined, 
    isReadyToFetch ? currentInstance : undefined
  );

  useEffect(() => {
    const { setCustomerId, setExternalCustomerId } = useCustomerStore.getState();
    if (customerDetails && stableCustomerId === customerDetails.id) {
      if (storeCustomerId !== customerDetails.id) {
      setCustomerId(customerDetails.id);
      setExternalCustomerId(customerDetails.external_customer_id);
    }
      setIsReadyToFetch(true); 
    } else if (isClientMounted && stableCustomerId && customerDetails === null && !customerDetailsLoading) {
      console.warn(`[Dashboard] Customer not found for stableCustomerId (${stableCustomerId}).`);
      setIsReadyToFetch(false);
    } else if (isClientMounted && stableCustomerId && customerDetails && stableCustomerId !== customerDetails.id && !customerDetailsLoading) {
      console.warn(`[Dashboard] Mismatch: stableCustomerId (${stableCustomerId}) !== fetched customerDetails.id (${customerDetails?.id}).`);
      setIsReadyToFetch(false);
    } else if (!stableCustomerId || !currentInstance) {
      setIsReadyToFetch(false);
    }
  }, [customerDetails, stableCustomerId, storeCustomerId, isClientMounted, customerDetailsLoading, currentInstance]);

  const companyConfig = useMemo(() => {
    if (!currentInstance) return null;
    const instanceConfigData = ORB_INSTANCES[currentInstance];
    if (!instanceConfigData) {
      console.error(`[Dashboard] Configuration for instance "${currentInstance}" not found.`);
      return null;
    }
    return getCurrentCompanyConfig(instanceConfigData.companyKey);
  }, [currentInstance]);

  const activeSubscription = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return null;
    return subscriptions.find(sub => sub.status === "active") || subscriptions[0];
  }, [subscriptions]);

  const currentPlanUIDetail = useMemo(() => {
    if (!activeSubscription?.plan?.id || !companyConfig?.uiPlans) {
      return null;
    }
    return companyConfig.uiPlans.find(p => p.plan_id === activeSubscription.plan!.id) || null;
  }, [activeSubscription, companyConfig]);

  const features = useMemo(() => {
    // Prepare the entitlement overrides config map first
    const entitlementOverridesConfig = new Map<string, { value?: string; perUnitDisplayName?: string }>();
    currentPlanUIDetail?.displayedEntitlementsOverride?.forEach(override => {
      entitlementOverridesConfig.set(override.name, { 
        value: override.value, 
        perUnitDisplayName: override.perUnitDisplayName 
      });
    });

    // 1. Derive all dynamic features first, passing the overrides map
    const allDynamicFeatures: EntitlementFeature[] = deriveEntitlementsFromSubscription(
      activeSubscription,
      companyConfig?.entitlementDisplayOrder,
      entitlementOverridesConfig // Pass the map here
    );

    // 2. Check if an override is defined and has items
    if (
      currentPlanUIDetail?.displayedEntitlementsOverride &&
      currentPlanUIDetail.displayedEntitlementsOverride.length > 0
    ) {
      const processedOverrideFeatures: EntitlementFeature[] = [];
      for (const overrideItem of currentPlanUIDetail.displayedEntitlementsOverride) {
        if (overrideItem.value === DYNAMIC_VALUE_SENTINEL) {
          const dynamicMatch = allDynamicFeatures.find(
            (dynamicFeature) => dynamicFeature.name === overrideItem.name
          );
          if (dynamicMatch) {
            processedOverrideFeatures.push(dynamicMatch);
          } else {
            console.warn(
              `[Entitlement Override] Dynamic feature named "${overrideItem.name}" requested by override was not found. Skipping.`
            );
          }
        } else {
          const dynamicMatch = allDynamicFeatures.find(
            (dynamicFeature) => dynamicFeature.name === overrideItem.name
          );

          processedOverrideFeatures.push({
            priceId: dynamicMatch?.priceId,
            priceIntervalId: dynamicMatch?.priceIntervalId,
            rawQuantity: dynamicMatch?.rawQuantity,
            rawOveragePrice: dynamicMatch?.rawOveragePrice,
            statusText: dynamicMatch?.statusText, 
            allFutureTransitions: dynamicMatch?.allFutureTransitions,
            tierDetails: dynamicMatch?.tierDetails,
            showDetailed: dynamicMatch?.showDetailed || false, 
            isAdjustableFixedPrice: dynamicMatch?.isAdjustableFixedPrice || false, 
            priceModelType: dynamicMatch?.priceModelType,
            overageInfo: dynamicMatch?.overageInfo, 
            name: overrideItem.name,
            baseValue: overrideItem.value,
          });
        }
      }
      return processedOverrideFeatures;
    }
    // 3. No override defined, return all dynamic features
    return allDynamicFeatures;
  }, [activeSubscription, companyConfig, currentPlanUIDetail]);

  const handleRemoveScheduledTransition = async (priceIntervalId: string, effectiveDate: string) => {
    if (!activeSubscription) {
      toast.error("Error", { description: "Active subscription not found." });
      return;
    }
    if (!priceIntervalId) {
        toast.error("Error", { description: "Price interval ID is missing for the transition." });
        return;
    }
    try {
      const result = await removeFixedFeeTransition(activeSubscription.id, priceIntervalId, effectiveDate);
      if (result.success) {
        toast.success("Scheduled Change Removed", { description: `The change scheduled for ${formatDate(effectiveDate)} has been removed.` });
        refreshSubscriptionData();
      } else {
        throw new Error(result.error || "Failed to remove scheduled change.");
      }
    } catch (error) {
      console.error("Error removing scheduled transition:", error);
      toast.error("Removal Failed", { description: error instanceof Error ? error.message : "An unknown error occurred."});
    }
  };

  const refreshSubscriptionData = () => {
    console.log("[Dashboard] Refreshing subscription data...", { stableCustomerId, currentInstance });
    if (stableCustomerId && currentInstance) {
        // Invalidate queries and refetch immediately
        queryClient.invalidateQueries({ queryKey: ['subscriptions', stableCustomerId, currentInstance] });
        queryClient.invalidateQueries({ queryKey: ['customerDetails', stableCustomerId, currentInstance] });
        
        // Also force a refetch to ensure fresh data
        queryClient.refetchQueries({ queryKey: ['subscriptions', stableCustomerId, currentInstance] });
        
        console.log("[Dashboard] Subscription data refresh triggered successfully");
    } else {
        console.warn("[Dashboard] Cannot refresh - missing stableCustomerId or currentInstance", { stableCustomerId, currentInstance });
    }
  };

  const handleInitiateAddAddOn = (priceId: string, itemName: string) => {
    setAddOnToInitiate({ priceId, itemName });
  };
  
  // Generic handler to open the adjust dialog
  const handleOpenAdjustFixedPriceDialog = (feature: EntitlementFeature) => {
    if (feature.isAdjustableFixedPrice && feature.priceIntervalId) {
      setFeatureToAdjust(feature);
      setIsAdjustFixedPriceDialogOpen(true);
    } else {
      console.warn("[Dashboard] Attempted to adjust a feature that is not adjustable or missing priceIntervalId:", feature);
      toast.error("Cannot Adjust Feature", { description: "This feature cannot be adjusted or is missing necessary information." });
    }
  };

  const handleOpenCancelFutureDialog = (priceIntervalId: string, priceIntervalName: string, currentStartDate: string) => {
    setFutureIntervalToCancel({ priceIntervalId, priceIntervalName, currentStartDate });
    setIsCancelFutureDialogOpen(true);
  };

  const handleOpenRemoveActiveDialog = (priceIntervalId: string, priceIntervalName: string) => {
    setActiveIntervalToRemove({ priceIntervalId, priceIntervalName });
    setIsRemoveActiveDialogOpen(true);
  };
  
  const handleDialogSuccessAndClose = () => {
      refreshSubscriptionData();
      setIsAdjustFixedPriceDialogOpen(false); 
      setFeatureToAdjust(null);
      setAddOnToInitiate(null);
      // Clear cancel dialog state
      setIsCancelFutureDialogOpen(false);
      setFutureIntervalToCancel(null);
      // Clear remove active dialog state
      setIsRemoveActiveDialogOpen(false);
      setActiveIntervalToRemove(null);
  };

  const showSkeletonView = !isClientMounted || !stableCustomerId || !currentInstance || !companyConfig || !isReadyToFetch || customerDetailsLoading || (isReadyToFetch && subscriptionsLoading);

  if (showSkeletonView) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Tabs defaultValue="subscriptions" className="space-y-6">
            <TabsList>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="customer-portal">Customer Portal</TabsTrigger>
            </TabsList>
            <TabsContent value="subscriptions">
              <div className="grid gap-6 md:grid-cols-2">
                <SubscriptionDetailsCard 
                  subscription={null} 
                  companyKey={currentInstance ? ORB_INSTANCES[currentInstance]?.companyKey : undefined}
                />
                <EntitlementsCard 
                  features={[]}
                  activeSubscription={null}
                  onOpenAdjustFixedPriceDialog={handleOpenAdjustFixedPriceDialog}
                  onInitiateAddAddOn={handleInitiateAddAddOn}
                  onRemoveScheduledTransition={handleRemoveScheduledTransition}
                  onOpenCancelFutureDialog={handleOpenCancelFutureDialog}
                  onOpenRemoveActiveDialog={handleOpenRemoveActiveDialog}
                  isLoading={true}
                />
              </div>
            </TabsContent>
            <TabsContent value="customer-portal">
              <CustomerPortalCard portalUrl={undefined} />
            </TabsContent>
          </Tabs>
        </main>
      </>
    );
  }

  const queryError = customerDetailsError || (isReadyToFetch && subscriptionsError);
  if (queryError) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error Loading Dashboard</AlertTitle><AlertDescription>{queryError.message}</AlertDescription></Alert>
      </div>
    );
  }

  if (!subscriptions || subscriptions.length === 0) { 
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card><CardHeader><CardTitle>No Subscriptions Found</CardTitle><CardDescription>Customer {stableCustomerId} doesn&apos;t have any active subscriptions yet.</CardDescription></CardHeader><CardFooter><Button onClick={() => router.push("/")}>Browse Plans</Button></CardFooter></Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
          <Tabs defaultValue="subscriptions" className="space-y-6">
            <TabsList>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="customer-portal">Customer Portal</TabsTrigger>
            </TabsList>
            <TabsContent value="subscriptions">
              <div className="grid gap-6 md:grid-cols-2">
                <SubscriptionDetailsCard 
                  subscription={activeSubscription} 
                  companyKey={currentInstance ? ORB_INSTANCES[currentInstance]?.companyKey : undefined}
                  onUpgradeSuccess={refreshSubscriptionData}
                />
                <EntitlementsCard 
                  features={features}
                  activeSubscription={activeSubscription}
                  onOpenAdjustFixedPriceDialog={handleOpenAdjustFixedPriceDialog}
                  onInitiateAddAddOn={handleInitiateAddAddOn}
                  onRemoveScheduledTransition={handleRemoveScheduledTransition}
                  onOpenCancelFutureDialog={handleOpenCancelFutureDialog}
                  onOpenRemoveActiveDialog={handleOpenRemoveActiveDialog}
                  isLoading={subscriptionsLoading}
                />
              </div>
            </TabsContent>
            <TabsContent value="customer-portal">
              <CustomerPortalCard portalUrl={customerDetails?.portal_url} />
            </TabsContent>
          </Tabs>
      </main>

      {/* Generic Dialog for Adjustable Fixed Price Items */}
      {isAdjustFixedPriceDialogOpen && activeSubscription && currentInstance && featureToAdjust && (
        <ManageFixedPriceItemDialog
          open={isAdjustFixedPriceDialogOpen}
          onOpenChange={setIsAdjustFixedPriceDialogOpen}
          itemName={featureToAdjust.name}
          dialogTitle={`Manage ${featureToAdjust.name}`}
          currentQuantity={featureToAdjust.rawQuantity || 0}
          addOnPrice={featureToAdjust.rawOveragePrice || 0}
          subscriptionId={activeSubscription.id}
          priceIntervalId={featureToAdjust.priceIntervalId!}
          priceAppliesToFirstUnit={featureToAdjust.priceModelType === "per_unit_with_minimum"}
          instance={currentInstance}
          activeSubscription={activeSubscription}
          currentPeriodStartDate={activeSubscription.current_period_start}
          onScheduleSuccess={handleDialogSuccessAndClose}
          onRemoveSuccess={handleDialogSuccessAndClose}
          companyKey={ORB_INSTANCES[currentInstance]?.companyKey}
          planId={activeSubscription.plan?.id}
        />
      )}
      
      {activeSubscription && addOnToInitiate && (
        <AddNewFloatingPriceDialog 
          open={!!addOnToInitiate}
          onOpenChange={(isOpen) => {
            if (!isOpen) setAddOnToInitiate(null);
          }}
          itemName={addOnToInitiate.itemName}
          priceIdToAdd={addOnToInitiate.priceId}
          subscriptionId={activeSubscription.id}
          onSuccess={handleDialogSuccessAndClose}
          currentInstance={currentInstance!}
        />
      )}

      {/* Cancel Future Price Interval Dialog */}
      {activeSubscription && currentInstance && futureIntervalToCancel && (
        <CancelFuturePriceIntervalDialog
          isOpen={isCancelFutureDialogOpen}
          onClose={() => {
            setIsCancelFutureDialogOpen(false);
            setFutureIntervalToCancel(null);
          }}
          subscriptionId={activeSubscription.id}
          priceIntervalId={futureIntervalToCancel.priceIntervalId}
          priceIntervalName={futureIntervalToCancel.priceIntervalName}
          currentStartDate={futureIntervalToCancel.currentStartDate}
          currentInstance={currentInstance}
          onSuccess={handleDialogSuccessAndClose}
        />
      )}

      {/* Remove Active Entitlement Dialog */}
      {activeIntervalToRemove && currentInstance && (
        <RemoveActiveEntitlementDialog
          isOpen={isRemoveActiveDialogOpen}
          onClose={() => {
            setIsRemoveActiveDialogOpen(false);
            setActiveIntervalToRemove(null);
          }}
          subscriptionId={activeSubscription?.id || ''}
          priceIntervalId={activeIntervalToRemove.priceIntervalId}
          priceIntervalName={activeIntervalToRemove.priceIntervalName}
          currentInstance={currentInstance}
          onSuccess={handleDialogSuccessAndClose}
        />
      )}
    </>
  )
} 