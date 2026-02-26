"use client";

import { MapPin, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressForm } from "@/app/account/addresses/address-form";

// ── Types ───────────────────────────────────────────────────

export interface Address {
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

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddressId: number | null;
  onSelectAddress: (addressId: number) => void;
  showAddressForm: boolean;
  onShowAddressForm: (show: boolean) => void;
  onAddressSaved: () => void;
}

// ── Component ───────────────────────────────────────────────

export function AddressSelector({
  addresses,
  selectedAddressId,
  onSelectAddress,
  showAddressForm,
  onShowAddressForm,
  onAddressSaved,
}: AddressSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          Shipping Address
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {addresses.length === 0 && !showAddressForm ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">
              No saved addresses. Add one to continue.
            </p>
            <Button size="sm" onClick={() => onShowAddressForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Address
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {addresses.map((addr) => (
                <label
                  key={addr.addressId}
                  className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all ${
                    selectedAddressId === addr.addressId
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "hover:border-muted-foreground/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={addr.addressId}
                    checked={selectedAddressId === addr.addressId}
                    onChange={() => onSelectAddress(addr.addressId)}
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{addr.fullName}</span>
                      {addr.label && (
                        <Badge variant="secondary" className="text-xs">
                          {addr.label}
                        </Badge>
                      )}
                      {addr.isDefault && (
                        <Badge className="text-xs">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {addr.addressLine1}
                      {addr.addressLine2 && `, ${addr.addressLine2}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {addr.phoneNumber}
                    </p>
                  </div>
                  {selectedAddressId === addr.addressId && (
                    <Check className="h-5 w-5 text-primary shrink-0" />
                  )}
                </label>
              ))}
            </div>

            {!showAddressForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShowAddressForm(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Address
              </Button>
            )}
          </>
        )}

        {showAddressForm && (
          <AddressForm
            onClose={() => onShowAddressForm(false)}
            onSaved={() => {
              onShowAddressForm(false);
              onAddressSaved();
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
