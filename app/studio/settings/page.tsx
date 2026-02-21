import {
  getDeliverySettings,
  getNewsletterSubscribers,
  getStoreSettings,
} from "@/lib/actions/admin-actions";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getPublicSiteConfig } from "@/lib/site-config";
import { PageHeader } from "@/components/admin/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeliverySettingForm } from "@/components/admin/delivery-setting-form";
import { StoreSettingsForm } from "@/components/admin/store-settings-form";
import { SiteAppearanceForm } from "@/components/admin/site-appearance-form";
import { PolicySettingsForm } from "@/components/admin/policy-settings-form";

export default async function SettingsPage() {
  const [settings, subscribers, storeSettings, allCategories, siteConfig] =
    await Promise.all([
      getDeliverySettings(),
      getNewsletterSubscribers(),
      getStoreSettings(),
      db
        .select({
          categoryId: categories.categoryId,
          categoryName: categories.categoryName,
          slug: categories.slug,
        })
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.sortOrder)),
      getPublicSiteConfig(),
    ]);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Store configuration & data"
      />

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="appearance">Site &amp; Appearance</TabsTrigger>
          <TabsTrigger value="store">Store &amp; Billing</TabsTrigger>
          <TabsTrigger value="delivery">Delivery Settings</TabsTrigger>
          <TabsTrigger value="policies">Policies &amp; Payments</TabsTrigger>
          <TabsTrigger value="newsletter">
            Newsletter ({subscribers.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Site & Appearance ─────────────────────────── */}
        <TabsContent value="appearance">
          <SiteAppearanceForm
            settings={{
              siteLogoUrl: siteConfig.siteLogoUrl ?? "",
              sitePrimaryColor: siteConfig.sitePrimaryColor,
              siteDescription: siteConfig.siteDescription ?? "",
              footerTagline: siteConfig.footerTagline ?? "",
              navLinksConfig: siteConfig.navLinksConfig,
              footerQuickLinks: siteConfig.footerQuickLinks,
              footerHelpLinks: siteConfig.footerHelpLinks,
              footerLegalLinks: siteConfig.footerLegalLinks,
              footerContactPhone: siteConfig.footerContactPhone ?? "",
              footerContactEmail: siteConfig.footerContactEmail ?? "",
              footerShowMadeInIndia: siteConfig.footerShowMadeInIndia,
              // SEO
              seoTitle: siteConfig.seoTitle ?? "",
              seoDescription: siteConfig.seoDescription ?? "",
              seoKeywords: siteConfig.seoKeywords ?? "",
              ogImageUrl: siteConfig.ogImageUrl ?? "",
              // Social
              socialInstagram: siteConfig.socialInstagram ?? "",
              socialFacebook: siteConfig.socialFacebook ?? "",
              socialTwitter: siteConfig.socialTwitter ?? "",
              socialYoutube: siteConfig.socialYoutube ?? "",
              // Hero
              heroTitle: siteConfig.heroTitle ?? "",
              heroSubtitle: siteConfig.heroSubtitle ?? "",
              heroBadgeText: siteConfig.heroBadgeText ?? "",
              heroCtaText: siteConfig.heroCtaText ?? "",
              heroCtaLink: siteConfig.heroCtaLink ?? "",
              heroSecondaryCtaText: siteConfig.heroSecondaryCtaText ?? "",
              heroSecondaryCtaLink: siteConfig.heroSecondaryCtaLink ?? "",
            }}
            categories={allCategories}
          />
        </TabsContent>

        {/* ── Store & Billing Settings ──────────────── */}
        <TabsContent value="store">
          <StoreSettingsForm settings={storeSettings} />
        </TabsContent>

        {/* ── Delivery Settings ─────────────────────── */}
        <TabsContent value="delivery">
          <div className="space-y-6">
            <div className="rounded-xl border bg-white shadow-sm p-6">
              <h3 className="text-sm font-semibold mb-4">Add / Edit Rule</h3>
              <DeliverySettingForm />
            </div>

            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead>Label</TableHead>
                    <TableHead>Min Order</TableHead>
                    <TableHead>Charge</TableHead>
                    <TableHead>Free?</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Edit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.map((s) => (
                    <TableRow key={s.settingId}>
                      <TableCell className="font-medium">{s.label}</TableCell>
                      <TableCell>₹{Number(s.minOrderAmount)}</TableCell>
                      <TableCell>₹{Number(s.deliveryCharge)}</TableCell>
                      <TableCell>
                        {s.isFreeDelivery ? (
                          <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                            Yes
                          </Badge>
                        ) : (
                          "No"
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {s.stateCode ?? "All"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={s.isActive ? "default" : "secondary"}
                          className={
                            s.isActive
                              ? "bg-green-100 text-green-700 border-0 text-xs"
                              : "text-xs"
                          }
                        >
                          {s.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DeliverySettingForm setting={s} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {settings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                        No delivery rules configured
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* ── Policies & Payments ─────────────────────── */}
        <TabsContent value="policies">
          <PolicySettingsForm
            settings={{
              returnPolicy: storeSettings?.returnPolicy ?? "accept",
              returnWindowDays: storeSettings?.returnWindowDays ?? 7,
              cancellationPolicy: storeSettings?.cancellationPolicy ?? "before_shipment",
              codEnabled: storeSettings?.codEnabled ?? true,
              autoRefundEnabled: storeSettings?.autoRefundEnabled ?? true,
            }}
          />
        </TabsContent>

        {/* ── Newsletter ─────────────────────────── */}
        <TabsContent value="newsletter">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscribed</TableHead>
                  <TableHead>Unsubscribed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((s) => (
                  <TableRow key={s.newsletterId}>
                    <TableCell className="font-medium">{s.email}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          s.isSubscribed
                            ? "bg-green-100 text-green-700 border-0 text-xs"
                            : "bg-red-100 text-red-700 border-0 text-xs"
                        }
                      >
                        {s.isSubscribed ? "Active" : "Unsubscribed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {new Date(s.subscribedAt).toLocaleDateString("en-IN", {
                        dateStyle: "medium",
                      })}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {s.unsubscribedAt
                        ? new Date(s.unsubscribedAt).toLocaleDateString("en-IN", {
                            dateStyle: "medium",
                          })
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {subscribers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                      No newsletter subscribers yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
