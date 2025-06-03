"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useCustomerStore } from "@/lib/store/customer-store"
import { Header } from "@/components/ui/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle } from "lucide-react"
import type { Subscription } from "@/lib/types";
import type { OrbInstance } from "@/lib/orb-config";
import { ORB_INSTANCES } from "@/lib/orb-config";
import { getCurrentCompanyConfig } from "@/lib/plans";
import { ManageFixedPriceItemDialog } from "./dialogs/manage-fixed-price-item-dialog";
import { AddNewFloatingPriceDialog } from "./dialogs/add-new-floating-price-dialog";
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

interface AddOnInitiateData {
  priceId: string;
  itemName: string;
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
  
  // State for the generic fixed price item adjustment dialog
  const [isAdjustFixedPriceDialogOpen, setIsAdjustFixedPriceDialogOpen] = useState(false);
  const [featureToAdjust, setFeatureToAdjust] = useState<EntitlementFeature | null>(null);
  
  const [addOnToInitiate, setAddOnToInitiate] = useState<AddOnInitiateData | null>(null);

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
    if (stableCustomerId && currentInstance) {
        queryClient.invalidateQueries({ queryKey: ['subscriptions', stableCustomerId, currentInstance] });
        queryClient.invalidateQueries({ queryKey: ['customerDetails', stableCustomerId, currentInstance] });
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
  
  const handleDialogSuccessAndClose = () => {
      refreshSubscriptionData();
      setIsAdjustFixedPriceDialogOpen(false); 
      setFeatureToAdjust(null); // Clear the feature being adjusted
      setAddOnToInitiate(null);
  };

  const showSkeletonView = !isClientMounted || !stableCustomerId || !currentInstance || !companyConfig || !isReadyToFetch || customerDetailsLoading || (isReadyToFetch && subscriptionsLoading);

  if (showSkeletonView) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <div className="grid gap-6 md:grid-cols-2">
                <SubscriptionDetailsCard 
                  activeSubscription={null} 
                  customerId={stableCustomerId || "Loading customer..."} 
                />
                <EntitlementsCard 
                  features={[]}
                  activeSubscription={null}
                  onOpenAdjustFixedPriceDialog={handleOpenAdjustFixedPriceDialog}
                  onInitiateAddAddOn={handleInitiateAddAddOn}
                  onRemoveScheduledTransition={handleRemoveScheduledTransition}
                  isLoading={true}
                />
              </div>
            </TabsContent>
            <TabsContent value="usage">
              <CustomerPortalCard portalUrl={undefined} />
            </TabsContent>
            <TabsContent value="billing">
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>View your past and upcoming invoices</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table><TableCaption>A list of your recent invoices.</TableCaption><TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell colSpan={5} className="text-center text-muted-foreground"><div className="h-4 bg-muted rounded animate-pulse w-32 mx-auto"></div></TableCell></TableRow></TableBody></Table>
                </CardContent>
              </Card>
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
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <div className="grid gap-6 md:grid-cols-2">
              <SubscriptionDetailsCard activeSubscription={activeSubscription} customerId={stableCustomerId!} />
                <EntitlementsCard 
                  features={features}
                  activeSubscription={activeSubscription}
                  onOpenAdjustFixedPriceDialog={handleOpenAdjustFixedPriceDialog}
                  onInitiateAddAddOn={handleInitiateAddAddOn}
                  onRemoveScheduledTransition={handleRemoveScheduledTransition}
                />
              </div>
            </TabsContent>
            <TabsContent value="usage">
              <CustomerPortalCard portalUrl={customerDetails?.portal_url} />
            </TabsContent>
            <TabsContent value="billing">
            <Card><CardHeader><CardTitle>Billing History</CardTitle><CardDescription>View your past and upcoming invoices</CardDescription></CardHeader><CardContent><Table><TableCaption>A list of your recent invoices.</TableCaption><TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Billing history coming soon.</TableCell></TableRow></TableBody></Table></CardContent></Card>
            </TabsContent>
          </Tabs>
      </main>

      {/* Generic Dialog for Adjustable Fixed Price Items */}
      {activeSubscription && currentInstance && featureToAdjust && featureToAdjust.priceIntervalId && (
        <ManageFixedPriceItemDialog
          key={featureToAdjust.priceIntervalId}
          open={isAdjustFixedPriceDialogOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setIsAdjustFixedPriceDialogOpen(false);
              setFeatureToAdjust(null);
            }
          }}
          itemName={featureToAdjust.name}
          dialogTitle={`Adjust ${featureToAdjust.name} Quantity`}
          dialogDescription={`Set the total number of ${featureToAdjust.name.toLowerCase()} effective from the chosen date.`}
          currentQuantity={featureToAdjust.rawQuantity ?? 0}
          addOnPrice={featureToAdjust.rawOveragePrice ?? 0}
          subscriptionId={activeSubscription.id}
          priceIntervalId={featureToAdjust.priceIntervalId}
          currentPeriodStartDate={activeSubscription.current_period_start}
          activeSubscription={activeSubscription}
          onScheduleSuccess={handleDialogSuccessAndClose}
          onRemoveSuccess={handleDialogSuccessAndClose}
          instance={currentInstance}
          priceAppliesToFirstUnit={featureToAdjust.priceModelType === 'unit'}
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
    </>
  )
} 