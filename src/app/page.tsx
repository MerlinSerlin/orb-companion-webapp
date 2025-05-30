"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { useCustomerStore } from "@/lib/store/customer-store"
import { type OrbInstance } from "@/lib/orb-config"
import { Brain, Cloud } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const setSelectedInstance = useCustomerStore((state) => state.setSelectedInstance)
  const logout = useCustomerStore((state) => state.logout)

  // Auto-logout when visiting homepage
  useEffect(() => {
    console.log('[Homepage] Auto-logout on homepage visit')
    logout()
  }, [logout])

  const handleInstanceSelect = (instance: OrbInstance) => {
    console.log(`[Homepage] Instance selected: ${instance}`)
    setSelectedInstance(instance)
    router.push('/plan-select')
  }

  const instances = [
    {
      key: 'cloud-infra' as OrbInstance,
      title: 'Cloud Infrastructure',
      description: 'Manage your cloud infrastructure billing and usage',
      icon: Cloud,
      color: 'bg-blue-500'
    },
    {
      key: 'ai-agents' as OrbInstance,
      title: 'AI Agents',
      description: 'Track AI agent usage and model consumption',
      icon: Brain,
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-center">
          <Logo />
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Orb Companion
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose your instance to get started with billing management and usage tracking
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {instances.map((instance) => {
            const IconComponent = instance.icon
            return (
              <Card key={instance.key} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${instance.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{instance.title}</CardTitle>
                  <CardDescription>{instance.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleInstanceSelect(instance.key)}
                    className="w-full"
                    size="lg"
                  >
                    Select {instance.title}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            Each instance connects to a separate Orb environment with its own customers and billing data
          </p>
        </div>
      </main>
    </div>
  )
}







