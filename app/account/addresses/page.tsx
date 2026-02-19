"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Star,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  getAddresses,
  deleteAddress,
  setDefaultAddress,
} from "@/lib/actions/account-actions";
import { AddressForm } from "./address-form";

interface Address {
  addressId: number;
  label: string | null;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  countryCode: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAddress, setEditAddress] = useState<Address | null>(null);

  const loadAddresses = useCallback(async () => {
    const data = await getAddresses();
    setAddresses(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  async function handleDelete(addressId: number) {
    if (!confirm("Are you sure you want to delete this address?")) return;
    const result = await deleteAddress(addressId);
    if (result.success) {
      toast.success("Address deleted");
      loadAddresses();
    }
  }

  async function handleSetDefault(addressId: number) {
    const result = await setDefaultAddress(addressId);
    if (result.success) {
      toast.success("Default address updated");
      loadAddresses();
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-2xl">
      <Link
        href="/account"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Account
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Saved Addresses</h1>
        {!showForm && !editAddress && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Address
          </Button>
        )}
      </div>

      {/* Add / Edit form */}
      {(showForm || editAddress) && (
        <div className="mb-6">
          <AddressForm
            address={editAddress || undefined}
            onClose={() => {
              setShowForm(false);
              setEditAddress(null);
            }}
            onSaved={() => {
              setShowForm(false);
              setEditAddress(null);
              loadAddresses();
            }}
          />
        </div>
      )}

      {/* Address List */}
      {addresses.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No saved addresses</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add an address for faster checkout.
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div
              key={addr.addressId}
              className="rounded-xl border p-5 transition-all hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{addr.fullName}</span>
                    {addr.label && (
                      <Badge variant="secondary" className="text-xs">
                        {addr.label}
                      </Badge>
                    )}
                    {addr.isDefault && (
                      <Badge className="text-xs">Default</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {addr.addressLine1}
                    {addr.addressLine2 && `, ${addr.addressLine2}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {addr.city}, {addr.state} — {addr.pincode}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Phone: {addr.phoneNumber}
                  </p>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditAddress(addr)}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(addr.addressId)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
                {!addr.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(addr.addressId)}
                  >
                    <Star className="mr-1.5 h-3.5 w-3.5" />
                    Set as Default
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
