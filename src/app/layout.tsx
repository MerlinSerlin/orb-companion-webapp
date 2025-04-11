import type React from "react"
import { Toaster } from "sonner"
import "@/app/globals.css"
import { QueryProvider } from "@/lib/query/query-provider"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <QueryProvider>
        <body>
          {children}
          <Toaster />
        </body>
      </QueryProvider>
    </html>
  )
}


