"use client"

import { usePathname } from "next/navigation"
import Image from "next/image"
import { ORB_INSTANCES, isValidInstance } from "@/lib/orb-config"
import { getCurrentCompanyConfig } from "@/components/plans/plan-data"

export function Logo() {
  const pathname = usePathname()
  
  // Extract instance from pathname (e.g., /cloud-infra/... -> cloud-infra)
  const pathSegments = pathname.split('/').filter(Boolean)
  const instance = pathSegments[0]
  
  // Get the appropriate configuration
  let companyName = "Orb Companion"
  let logoPath = "/cloud.svg" // default fallback
  
  if (instance && isValidInstance(instance)) {
    const instanceConfig = ORB_INSTANCES[instance]
    const companyConfig = getCurrentCompanyConfig(instanceConfig.companyKey)
    companyName = companyConfig.companyName
    logoPath = companyConfig.logo
  }
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8">
        <Image 
          src={logoPath} 
          alt={`${companyName} logo`}
          width={32}
          height={32}
          className="text-primary"
        />
      </div>
      <span className="font-bold text-xl">{companyName}</span>
    </div>
  )
}

