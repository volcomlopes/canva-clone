"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { CreditCard, Crown, Loader, LogOut, ShieldCheck } from "lucide-react";

import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePaywall } from "@/features/subscriptions/hooks/use-paywall";
import { useBilling } from "@/features/subscriptions/api/use-billing";

export const UserButton = () => {
  const { shouldBlock, triggerPaywall, isLoading } = usePaywall();
  const mutation = useBilling();
  const session = useSession();

  const onClick = () => {
    if (shouldBlock) {
      triggerPaywall();
      return;
    }

    mutation.mutate();
  };

  if (session.status === "loading") {
    return <Loader className="size-4 animate-spin text-muted-foreground" />
  }

  if (session.status === "unauthenticated" || !session.data) {
    return null;
  }

  const name = session.data?.user?.name!;
  const imageUrl = session.data?.user?.image;
  const isSuperAdmin = session.data?.user?.role === "super_admin";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="outline-none relative">
        {!shouldBlock && !isLoading && (
          <div className="absolute -top-1 -left-1 z-10 flex items-center justify-center">
            <div className="rounded-full bg-white flex items-center justify-center p-1 drop-shadow-sm">
              <Crown className="size-3 text-yellow-500 fill-yellow-500" />
            </div>
          </div>
        )}
        <Avatar className="size-10 hover:opacity-75 transition">
          <AvatarImage alt={name} src={imageUrl || ""} />
          <AvatarFallback className="bg-blue-500 font-medium text-white flex items-center justify-center">
            {(name || "U").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {/* Botão Admin - só aparece para super_admin */}
        {isSuperAdmin && (
          <>
            <DropdownMenuItem asChild className="h-10">
              <Link href="/admin">
                <ShieldCheck className="size-4 mr-2 text-blue-600" />
                <span className="font-medium">Admin Panel</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          disabled={mutation.isPending}
          onClick={onClick}
          className="h-10"
        >
          <CreditCard className="size-4 mr-2" />
          Billing
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="h-10" onClick={() => signOut()}>
          <LogOut className="size-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};