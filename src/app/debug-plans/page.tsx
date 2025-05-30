"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { listPlans } from "@/app/actions/orb"

interface Plan {
  id: string
  name: string
  description: string
  status: string
}

interface PlansResult {
  success: boolean
  plans?: Plan[]
  error?: string
}

export default function DebugPlansPage() {
  const [cloudInfraPlans, setCloudInfraPlans] = useState<PlansResult | null>(null)
  const [aiAgentsPlans, setAiAgentsPlans] = useState<PlansResult | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchPlans = async (instance: 'cloud-infra' | 'ai-agents') => {
    setLoading(true)
    try {
      const result = await listPlans(instance)
      if (instance === 'cloud-infra') {
        setCloudInfraPlans(result)
      } else {
        setAiAgentsPlans(result)
      }
    } catch (error) {
      console.error(`Error fetching ${instance} plans:`, error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Debug: Orb Plans</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Cloud Infra Plans */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Cloud Infra (Nimbus Scale)</h2>
          <Button 
            onClick={() => fetchPlans('cloud-infra')} 
            disabled={loading}
            className="mb-4"
          >
            {loading ? 'Loading...' : 'Fetch Plans'}
          </Button>
          
          {cloudInfraPlans && (
            <div>
              <h3 className="font-medium mb-2">
                {cloudInfraPlans.success ? 'Plans Found:' : 'Error:'}
              </h3>
              {cloudInfraPlans.success && cloudInfraPlans.plans ? (
                <ul className="space-y-2">
                  {cloudInfraPlans.plans.map((plan: Plan) => (
                    <li key={plan.id} className="bg-gray-50 p-3 rounded">
                      <div className="font-mono text-sm text-blue-600">{plan.id}</div>
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-sm text-gray-600">{plan.description}</div>
                      <div className="text-xs text-gray-500">Status: {plan.status}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-red-600">{cloudInfraPlans.error}</div>
              )}
            </div>
          )}
        </div>

        {/* AI Agents Plans */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">AI Agents (Neural Prime)</h2>
          <Button 
            onClick={() => fetchPlans('ai-agents')} 
            disabled={loading}
            className="mb-4"
          >
            {loading ? 'Loading...' : 'Fetch Plans'}
          </Button>
          
          {aiAgentsPlans && (
            <div>
              <h3 className="font-medium mb-2">
                {aiAgentsPlans.success ? 'Plans Found:' : 'Error:'}
              </h3>
              {aiAgentsPlans.success && aiAgentsPlans.plans ? (
                <ul className="space-y-2">
                  {aiAgentsPlans.plans.map((plan: Plan) => (
                    <li key={plan.id} className="bg-gray-50 p-3 rounded">
                      <div className="font-mono text-sm text-blue-600">{plan.id}</div>
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-sm text-gray-600">{plan.description}</div>
                      <div className="text-xs text-gray-500">Status: {plan.status}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-red-600">{aiAgentsPlans.error}</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-medium text-yellow-800 mb-2">Current Plan IDs in plan-data.ts:</h3>
        <div className="text-sm text-yellow-700">
          <div><strong>Cloud Infra:</strong></div>
          <ul className="ml-4 mb-2">
            <li>• kRDwGmuatwQJdNLY (Starter)</li>
            <li>• egBAFXj9pykJhyeA (Pro) ← This one is failing</li>
            <li>• nimbus_scale_enterprise (Enterprise)</li>
          </ul>
          <div><strong>AI Agents:</strong></div>
          <ul className="ml-4">
            <li>• oQa7qs95URdTSoqG (Enterprise)</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 