import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBillableMetric } from '@/app/actions/orb'
import type { OrbInstance } from '@/lib/orb-config'
import type { Subscription } from '@/lib/types'

const PREMIUM_MODELS_BILLABLE_METRIC_ID = 'eAk24gtLjCDs2rWS'

export type ModelAccessInfo = {
  hasAccess: boolean
  isLoading: boolean
  error: string | null
  premiumModels: string[]
  standardModels: string[]
}

export function usePremiumModelAccess(
  subscription: Subscription | null | undefined,
  instance: OrbInstance,
  allModels: string[]
): ModelAccessInfo {
  const [modelAccessInfo, setModelAccessInfo] = useState<ModelAccessInfo>({
    hasAccess: false,
    isLoading: true,
    error: null,
    premiumModels: [],
    standardModels: allModels
  })

  // Check if customer has premium model entitlement
  const hasPremiumEntitlement = Boolean(
    subscription?.price_intervals?.some(interval => 
      interval.price?.billable_metric?.id === PREMIUM_MODELS_BILLABLE_METRIC_ID
    ) || subscription?.plan?.prices?.some(price => 
      price.billable_metric?.id === PREMIUM_MODELS_BILLABLE_METRIC_ID
    )
  )

  // Fetch billable metric details to get premium model list from metadata
  const { data: metricResult, isLoading: isLoadingMetric, error: metricError } = useQuery({
    queryKey: ['billableMetric', PREMIUM_MODELS_BILLABLE_METRIC_ID, instance],
    queryFn: () => getBillableMetric(PREMIUM_MODELS_BILLABLE_METRIC_ID, instance),
    enabled: Boolean(subscription), // Only fetch if we have subscription data
    staleTime: 5 * 60 * 1000, // 5 minutes - metric metadata doesn't change often
    retry: 2
  })

  useEffect(() => {
    // Still loading subscription or metric data
    if (!subscription || isLoadingMetric) {
      setModelAccessInfo(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }))
      return
    }

    // Error fetching metric
    if (metricError || !metricResult?.success) {
      const errorMessage = metricResult?.error || 'Failed to determine model access'
      setModelAccessInfo({
        hasAccess: false,
        isLoading: false,
        error: errorMessage,
        premiumModels: [],
        standardModels: allModels
      })
      return
    }

    // Extract premium models from metric metadata
    const metricMetadata = metricResult.metric?.metadata || {}
    const premiumModels: string[] = []
    
    Object.entries(metricMetadata).forEach(([modelName, value]) => {
      if (value === 'true') {
        premiumModels.push(modelName)
      }
    })

    // Determine standard models (all models not in premium list)
    const standardModels = allModels.filter(model => !premiumModels.includes(model))

    setModelAccessInfo({
      hasAccess: hasPremiumEntitlement,
      isLoading: false,
      error: null,
      premiumModels,
      standardModels
    })

  }, [subscription, hasPremiumEntitlement, metricResult, metricError, isLoadingMetric, allModels])

  return modelAccessInfo
}