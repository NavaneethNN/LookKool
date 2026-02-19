export const siteConfig = {
  name: "LookKool",
  description:
    "Your go-to women's boutique for trendy, affordable fashion at LookKool.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  logo: "/NewLogo.png",
  brandColor: "#470B49",
} as const;

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop All", href: "/categories/women" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Collections", href: "/collections" },
  { label: "Offers", href: "/offers" },
] as const;
