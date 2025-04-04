import { PricingPlans } from "@/components/plans/pricing-plans"
import { Logo } from "@/components/logo"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Simplified Header */}
      <header className="container mx-auto py-4 flex justify-between items-center">
        <Logo />
        <div className="flex gap-4">
          <button className="text-sm font-medium hover:text-primary">Sign In</button>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
            Get Started
          </button>
        </div>
      </header>

      {/* Compact Hero Section */}
      <section className="container mx-auto pt-8 pb-6">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl mb-3">
            Choose the perfect plan for your <span className="text-primary">cloud needs</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            All plans include 99.9% uptime, 24/7 support, and no hidden fees.
          </p>
        </div>
      </section>

      {/* Pricing Plans - Now Above the Fold */}
      <PricingPlans />

      {/* Features Section - Below the Fold */}
      <section className="container mx-auto py-16 mt-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">Why Choose NimbusScale?</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Our infrastructure is designed to scale with your business needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-lg border border-border/50 transform hover:-translate-y-1 transition-transform">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"></path>
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Scalable Infrastructure</h3>
            <p className="text-muted-foreground">Scale up or down instantly based on your needs with no downtime.</p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border/50 transform hover:-translate-y-1 transition-transform">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m4.9 4.9 14.2 14.2"></path>
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Global CDN</h3>
            <p className="text-muted-foreground">
              Deliver content to your users with lightning-fast speeds from 200+ locations.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border/50 transform hover:-translate-y-1 transition-transform">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                <path d="M7 7h10"></path>
                <path d="M7 12h10"></path>
                <path d="M7 17h10"></path>
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Easy Management</h3>
            <p className="text-muted-foreground">Intuitive dashboard to monitor and manage all your cloud resources.</p>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t mt-8">
        <div className="container mx-auto py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Logo />
            <p className="text-sm text-muted-foreground mt-4 md:mt-0">
              © {new Date().getFullYear()} NimbusScale. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}





