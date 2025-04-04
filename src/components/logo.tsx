import { Cloud, Zap } from "lucide-react"

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Cloud className="h-8 w-8 text-primary" />
        <Zap className="h-4 w-4 text-primary absolute bottom-0 right-0" />
      </div>
      <span className="font-bold text-xl">NimbusScale</span>
    </div>
  )
}

