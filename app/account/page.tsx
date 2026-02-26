import { requireAuthOrRedirect } from "@/lib/auth-helpers";
import { signOut } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Mail, LogOut, Package, Heart, MapPin, Pencil } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account",
};

export default async function AccountPage() {
  const session = await requireAuthOrRedirect();
  const user = session.user;

  const fullName = user.name || user.email?.split("@")[0] || "User";

  const quickLinks = [
    { icon: Package, label: "My Orders", href: "/account/orders" },
    { icon: Heart, label: "Wishlist", href: "/wishlist" },
    { icon: MapPin, label: "Saved Addresses", href: "/account/addresses" },
    { icon: Pencil, label: "Edit Profile", href: "/account/profile" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-2xl">
      <h1 className="text-2xl font-bold sm:text-3xl mb-6">My Account</h1>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{fullName}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-3 mt-6 sm:grid-cols-3">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="transition-colors hover:border-primary/30 hover:shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <link.icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{link.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Separator className="my-6" />

      <form action={signOut}>
        <Button variant="outline" type="submit" className="w-full sm:w-auto">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </form>
    </div>
  );
}
