"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

interface PlanFeature {
  name: string
  value: string
}

interface PlanCardProps {
  plan_id: string
  name: string
  description: string
  price: string
  billingInterval?: 'month' | 'year' | null
  features: PlanFeature[]
  onSubscribe: () => void
  onContactSales: () => void
  cta: string
}

export function PlanCard({
  name,
  description,
  price,
  billingInterval,
  features,
  onSubscribe,
  onContactSales,
  cta,
}: PlanCardProps) {
  return (
    <Card className="relative flex flex-col min-h-[34rem]">
      <CardHeader>
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4">
          <span className="text-3xl font-bold">{price}</span>
          {billingInterval && <span className="text-sm text-gray-500 ml-1">/{billingInterval}</span>}
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-3" />
              <span className="text-sm">{feature.name}: {feature.value}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {cta === "Contact Sales" ? (
          <Button 
            onClick={onContactSales}
            className="w-full"
            variant="outline"
          >
            {cta}
          </Button>
        ) : (
          <Button 
            onClick={onSubscribe}
            className="w-full"
          >
            {cta}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
} 