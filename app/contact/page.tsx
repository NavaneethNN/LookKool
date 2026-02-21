import { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import { getPublicSiteConfig } from "@/lib/site-config";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getPublicSiteConfig();
  return {
    title: `Contact Us – ${siteConfig.businessName}`,
    description: `Get in touch with ${siteConfig.businessName}. We're here to help!`,
  };
}

export default async function ContactPage() {
  const siteConfig = await getPublicSiteConfig();

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Contact Us</h1>
      <p className="text-muted-foreground mb-10">
        We&apos;d love to hear from you. Reach out to us using any of the methods below.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {siteConfig.footerContactEmail && (
          <div className="flex items-start gap-4 rounded-xl border bg-card p-6">
            <Mail className="h-6 w-6 text-primary mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold mb-1">Email</h2>
              <a
                href={`mailto:${siteConfig.footerContactEmail}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {siteConfig.footerContactEmail}
              </a>
            </div>
          </div>
        )}

        {siteConfig.footerContactPhone && (
          <div className="flex items-start gap-4 rounded-xl border bg-card p-6">
            <Phone className="h-6 w-6 text-primary mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold mb-1">Phone</h2>
              <a
                href={`tel:${siteConfig.footerContactPhone}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {siteConfig.footerContactPhone}
              </a>
            </div>
          </div>
        )}

        <div className="flex items-start gap-4 rounded-xl border bg-card p-6 sm:col-span-2">
          <MapPin className="h-6 w-6 text-primary mt-0.5 shrink-0" />
          <div>
            <h2 className="font-semibold mb-1">Visit Us</h2>
            <p className="text-sm text-muted-foreground">
              {siteConfig.businessName}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-xl border bg-card p-6">
        <h2 className="font-semibold text-lg mb-2">Business Hours</h2>
        <p className="text-sm text-muted-foreground">
          Monday – Saturday: 10:00 AM – 8:00 PM
        </p>
        <p className="text-sm text-muted-foreground">Sunday: Closed</p>
      </div>

      {(siteConfig.socialInstagram || siteConfig.socialFacebook) && (
        <div className="mt-10 rounded-xl border bg-card p-6">
          <h2 className="font-semibold text-lg mb-3">Follow Us</h2>
          <div className="flex gap-4">
            {siteConfig.socialInstagram && (
              <a
                href={siteConfig.socialInstagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Instagram
              </a>
            )}
            {siteConfig.socialFacebook && (
              <a
                href={siteConfig.socialFacebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Facebook
              </a>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
