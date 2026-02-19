"use client";

import { useTransition } from "react";
import { updateUserRole } from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, ShieldOff } from "lucide-react";

interface CustomerRoleToggleProps {
  userId: string;
  currentRole: string;
}

export function CustomerRoleToggle({
  userId,
  currentRole,
}: CustomerRoleToggleProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const newRole = currentRole === "admin" ? "customer" : "admin";
    const label = newRole === "admin" ? "admin" : "customer";
    if (!confirm(`Change this user's role to ${label}?`)) return;

    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole);
        toast.success(`Role updated to ${label}`);
      } catch {
        toast.error("Failed to update role");
      }
    });
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={isPending}
      variant={currentRole === "admin" ? "destructive" : "outline"}
      size="sm"
    >
      {currentRole === "admin" ? (
        <>
          <ShieldOff className="w-4 h-4 mr-1" />
          Remove Admin
        </>
      ) : (
        <>
          <Shield className="w-4 h-4 mr-1" />
          Make Admin
        </>
      )}
    </Button>
  );
}
