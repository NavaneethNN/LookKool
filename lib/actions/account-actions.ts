"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users, userAddresses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Constants ─────────────────────────────────────────────────

const MAX_NAME_LENGTH = 150;
const MAX_ADDRESS_LINE_LENGTH = 500;
const MAX_CITY_LENGTH = 100;
const MAX_STATE_LENGTH = 100;
const MAX_LABEL_LENGTH = 50;
const PINCODE_REGEX = /^\d{6}$/;
const PHONE_REGEX = /^\d{10,15}$/;
const MAX_ADDRESSES_PER_USER = 10;

// ─── Helpers ───────────────────────────────────────────────────

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

function validateAddressFields(fields: {
  fullName: string | null;
  phoneNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  label: string | null;
}): { error?: string } {
  const { fullName, phoneNumber, addressLine1, addressLine2, city, state, pincode, label } = fields;

  if (!fullName || !phoneNumber || !addressLine1 || !city || !state || !pincode) {
    return { error: "All required fields must be filled" };
  }
  if (fullName.length > MAX_NAME_LENGTH) {
    return { error: `Name must not exceed ${MAX_NAME_LENGTH} characters` };
  }
  if (label && label.length > MAX_LABEL_LENGTH) {
    return { error: `Label must not exceed ${MAX_LABEL_LENGTH} characters` };
  }
  if (!PHONE_REGEX.test(phoneNumber)) {
    return { error: "Please enter a valid phone number (10-15 digits)" };
  }
  if (addressLine1.length > MAX_ADDRESS_LINE_LENGTH) {
    return { error: `Address line 1 is too long` };
  }
  if (addressLine2 && addressLine2.length > MAX_ADDRESS_LINE_LENGTH) {
    return { error: `Address line 2 is too long` };
  }
  if (city.length > MAX_CITY_LENGTH) {
    return { error: `City name is too long` };
  }
  if (state.length > MAX_STATE_LENGTH) {
    return { error: `State name is too long` };
  }
  if (!PINCODE_REGEX.test(pincode)) {
    return { error: "Please enter a valid 6-digit pincode" };
  }

  return {};
}

// ─── Profile ───────────────────────────────────────────────────

export async function updateProfile(formData: FormData) {
  const user = await getAuthUser();
  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!name || name.length < 2) {
    return { error: "Name must be at least 2 characters" };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `Name must not exceed ${MAX_NAME_LENGTH} characters` };
  }
  if (phone && !PHONE_REGEX.test(phone)) {
    return { error: "Please enter a valid phone number (10-15 digits)" };
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

  // ─── Validate all fields ──────────────────────────────────
  const validation = validateAddressFields({
    fullName: fullName ?? null,
    phoneNumber: phoneNumber ?? null,
    addressLine1: addressLine1 ?? null,
    addressLine2,
    city: city ?? null,
    state: state ?? null,
    pincode: pincode ?? null,
    label,
  });
  if (validation.error) return validation;

  // ─── Limit addresses per user ─────────────────────────────
  const existing = await db
    .select({ addressId: userAddresses.addressId })
    .from(userAddresses)
    .where(eq(userAddresses.userId, user.id));

  if (existing.length >= MAX_ADDRESSES_PER_USER) {
    return { error: `You can save a maximum of ${MAX_ADDRESSES_PER_USER} addresses` };
  }

  // If this address is default, unset existing defaults
  if (isDefault) {
    await db
      .update(userAddresses)
      .set({ isDefault: false })
      .where(eq(userAddresses.userId, user.id));
  }

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

  if (!Number.isInteger(addressId) || addressId < 1) {
    return { error: "Invalid address" };
  }

  const label = (formData.get("label") as string)?.trim() || null;
  const fullName = (formData.get("fullName") as string)?.trim();
  const phoneNumber = (formData.get("phoneNumber") as string)?.trim();
  const addressLine1 = (formData.get("addressLine1") as string)?.trim();
  const addressLine2 = (formData.get("addressLine2") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim();
  const state = (formData.get("state") as string)?.trim();
  const pincode = (formData.get("pincode") as string)?.trim();
  const isDefault = formData.get("isDefault") === "on";

  // ─── Validate all fields ──────────────────────────────────
  const validation = validateAddressFields({
    fullName: fullName ?? null,
    phoneNumber: phoneNumber ?? null,
    addressLine1: addressLine1 ?? null,
    addressLine2,
    city: city ?? null,
    state: state ?? null,
    pincode: pincode ?? null,
    label,
  });
  if (validation.error) return validation;

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

  if (!Number.isInteger(addressId) || addressId < 1) {
    return { error: "Invalid address" };
  }

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

  if (!Number.isInteger(addressId) || addressId < 1) {
    return { error: "Invalid address" };
  }

  // Verify address belongs to user before modifying
  const [addr] = await db
    .select({ addressId: userAddresses.addressId })
    .from(userAddresses)
    .where(
      and(
        eq(userAddresses.addressId, addressId),
        eq(userAddresses.userId, user.id)
      )
    )
    .limit(1);

  if (!addr) {
    return { error: "Address not found" };
  }

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
