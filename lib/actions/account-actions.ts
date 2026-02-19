"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users, userAddresses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Helpers ───────────────────────────────────────────────────

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

// ─── Profile ───────────────────────────────────────────────────

export async function updateProfile(formData: FormData) {
  const user = await getAuthUser();
  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!name || name.length < 2) {
    return { error: "Name must be at least 2 characters" };
  }

  // Update Supabase auth metadata
  const supabase = await createClient();
  await supabase.auth.updateUser({
    data: { full_name: name },
  });

  // Upsert into our users table
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.userId, user.id))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(users)
      .set({ name, phoneNumber: phone, updatedAt: new Date() })
      .where(eq(users.userId, user.id));
  } else {
    await db.insert(users).values({
      userId: user.id,
      name,
      email: user.email!,
      phoneNumber: phone,
    });
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { success: true };
}

export async function getProfile() {
  const user = await getAuthUser();
  const profile = await db
    .select()
    .from(users)
    .where(eq(users.userId, user.id))
    .limit(1);

  return {
    userId: user.id,
    email: user.email!,
    name:
      profile[0]?.name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "",
    phone: profile[0]?.phoneNumber || "",
  };
}

// ─── Addresses ─────────────────────────────────────────────────

export async function getAddresses() {
  const user = await getAuthUser();
  const addresses = await db
    .select()
    .from(userAddresses)
    .where(eq(userAddresses.userId, user.id))
    .orderBy(userAddresses.isDefault);

  return addresses.map((a) => ({
    addressId: a.addressId,
    label: a.label,
    fullName: a.fullName,
    phoneNumber: a.phoneNumber,
    addressLine1: a.addressLine1,
    addressLine2: a.addressLine2,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    countryCode: a.countryCode,
    isDefault: a.isDefault,
  }));
}

export async function addAddress(formData: FormData) {
  const user = await getAuthUser();

  const label = (formData.get("label") as string)?.trim() || null;
  const fullName = (formData.get("fullName") as string)?.trim();
  const phoneNumber = (formData.get("phoneNumber") as string)?.trim();
  const addressLine1 = (formData.get("addressLine1") as string)?.trim();
  const addressLine2 = (formData.get("addressLine2") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim();
  const state = (formData.get("state") as string)?.trim();
  const pincode = (formData.get("pincode") as string)?.trim();
  const isDefault = formData.get("isDefault") === "on";

  if (!fullName || !phoneNumber || !addressLine1 || !city || !state || !pincode) {
    return { error: "All required fields must be filled" };
  }

  // If this address is default, unset any existing default
  if (isDefault) {
    await db
      .update(userAddresses)
      .set({ isDefault: false })
      .where(eq(userAddresses.userId, user.id));
  }

  // Check if this is first address — auto-default
  const existing = await db
    .select()
    .from(userAddresses)
    .where(eq(userAddresses.userId, user.id))
    .limit(1);
  const shouldDefault = isDefault || existing.length === 0;

  await db.insert(userAddresses).values({
    userId: user.id,
    label,
    fullName,
    phoneNumber,
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    isDefault: shouldDefault,
  });

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}

export async function updateAddress(addressId: number, formData: FormData) {
  const user = await getAuthUser();

  const label = (formData.get("label") as string)?.trim() || null;
  const fullName = (formData.get("fullName") as string)?.trim();
  const phoneNumber = (formData.get("phoneNumber") as string)?.trim();
  const addressLine1 = (formData.get("addressLine1") as string)?.trim();
  const addressLine2 = (formData.get("addressLine2") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim();
  const state = (formData.get("state") as string)?.trim();
  const pincode = (formData.get("pincode") as string)?.trim();
  const isDefault = formData.get("isDefault") === "on";

  if (!fullName || !phoneNumber || !addressLine1 || !city || !state || !pincode) {
    return { error: "All required fields must be filled" };
  }

  // If this address is default, unset others
  if (isDefault) {
    await db
      .update(userAddresses)
      .set({ isDefault: false })
      .where(eq(userAddresses.userId, user.id));
  }

  await db
    .update(userAddresses)
    .set({
      label,
      fullName,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      isDefault,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userAddresses.addressId, addressId),
        eq(userAddresses.userId, user.id)
      )
    );

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}

export async function deleteAddress(addressId: number) {
  const user = await getAuthUser();

  await db
    .delete(userAddresses)
    .where(
      and(
        eq(userAddresses.addressId, addressId),
        eq(userAddresses.userId, user.id)
      )
    );

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}

export async function setDefaultAddress(addressId: number) {
  const user = await getAuthUser();

  // Unset all
  await db
    .update(userAddresses)
    .set({ isDefault: false })
    .where(eq(userAddresses.userId, user.id));

  // Set the selected one
  await db
    .update(userAddresses)
    .set({ isDefault: true })
    .where(
      and(
        eq(userAddresses.addressId, addressId),
        eq(userAddresses.userId, user.id)
      )
    );

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}
