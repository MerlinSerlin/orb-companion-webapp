// Plan details for UI display
export const PLAN_DETAILS = [
  {
    id: "plan_starter",
    name: "Starter",
    description: "For small projects and personal websites",
    price: "$29",
    features: [
      { name: "Bandwidth", value: "100 GB" },
      { name: "Edge Requests", value: "1M requests" },
      { name: "Storage", value: "10 GB" },
      { name: "Builds", value: "100 per month" },
      { name: "Build Minutes", value: "300 minutes" },
    ],
    cta: "Select Starter",
    popular: false,
  },
  {
    id: "plan_pro",
    name: "Pro",
    description: "For growing businesses and high-traffic sites",
    price: "$99",
    features: [
      { name: "Bandwidth", value: "500 GB" },
      { name: "Edge Requests", value: "5M requests" },
      { name: "Storage", value: "50 GB" },
      { name: "Builds", value: "Unlimited" },
      { name: "Build Minutes", value: "1,000 minutes" },
    ],
    cta: "Select Pro",
    popular: true,
  },
  {
    id: "plan_enterprise",
    name: "Enterprise",
    description: "For large-scale applications with high demands",
    price: "$299",
    features: [
      { name: "Bandwidth", value: "2 TB" },
      { name: "Edge Requests", value: "25M requests" },
      { name: "Storage", value: "250 GB" },
      { name: "Builds", value: "Unlimited" },
      { name: "Build Minutes", value: "5,000 minutes" },
    ],
    cta: "Select Enterprise",
    popular: false,
  },
]





