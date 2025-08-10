export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "DeFiFlow",
  description:
    "AI-powered yield optimization agent for cross-chain DeFi",
  mainNav: [
    {
      title: "Dashboard",
      href: "/",
    },
    {
      title: "Positions",
      href: "/#positions",
    },
    {
      title: "Strategies",
      href: "/#strategies",
    },
    {
      title: "Analytics",
      href: "/analytics",
    },
  ],
  links: {
    twitter: "https://twitter.com/defiflow",
    github: "https://github.com/kamalbuilds/defiflow-agent",
    docs: "https://docs.defiflow.ai",
  },
}
