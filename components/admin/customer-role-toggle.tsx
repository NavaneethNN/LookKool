"use client";

import { useTransition } from "react";
import { updateUserRole } from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Shield, ShieldOff, ChevronDown, UserCog } from "lucide-react";

interface CustomerRoleToggleProps {
  userId: string;
  currentRole: string;
}

const roleConfig = {
  admin: { label: "Admin", icon: Shield, variant: "destructive" as const },
  cashier: { label: "Cashier", icon: UserCog, variant: "secondary" as const },
  customer: { label: "Customer", icon: ShieldOff, variant: "outline" as const },
} as const;

type RoleKey = keyof typeof roleConfig;

export function CustomerRoleToggle({
  userId,
  currentRole,
}: CustomerRoleToggleProps) {
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(newRole: RoleKey) {
    if (newRole === currentRole) return;
    if (!confirm(`Change this user's role to ${roleConfig[newRole].label}?`)) return;

    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole);
        toast.success(`Role updated to ${roleConfig[newRole].label}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update role");
      }
    });
  }

  const current = roleConfig[(currentRole as RoleKey) ?? "customer"] ?? roleConfig.customer;
  const CurrentIcon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={isPending}
          variant={current.variant}
          size="sm"
        >
          <CurrentIcon className="w-4 h-4 mr-1" />
          {current.label}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(roleConfig) as RoleKey[]).map((role) => {
          const Icon = roleConfig[role].icon;
          return (
            <DropdownMenuItem
              key={role}
              disabled={role === currentRole}
              onClick={() => handleRoleChange(role)}
            >
              <Icon className="w-4 h-4 mr-2" />
              {roleConfig[role].label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
