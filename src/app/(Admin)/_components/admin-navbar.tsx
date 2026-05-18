"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

// Mapeia URLs pra títulos amigáveis
const getPageTitle = (pathname: string): string => {
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/brands")) return "Marcas";
  if (pathname.startsWith("/admin/users")) return "Usuários";
  if (pathname.startsWith("/admin/settings")) return "Configurações";
  return "Admin";
};

export const AdminNavbar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  const title = getPageTitle(pathname);
  const userName = session?.user?.name || "Usuário";
  const userImage = session?.user?.image || "";
  const initial = userName.charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-10">
      {/* Título da página */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {title}
        </h1>
      </div>

      {/* Usuário */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-slate-900">
            {userName}
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">
            Super Admin
          </span>
        </div>
        <Avatar className="size-9 border-2 border-slate-200">
          <AvatarImage src={userImage} alt={userName} />
          <AvatarFallback className="bg-blue-500 text-white font-medium">
            {initial}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};