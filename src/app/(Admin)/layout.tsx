import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AdminSidebar } from "./_components/admin-sidebar";
import { AdminNavbar } from "./_components/admin-navbar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // 🔒 PROTEÇÃO: só Super Admin acessa /admin
  const session = await auth();

  // Não logado → manda pro login
  if (!session?.user) {
    redirect("/sign-in");
  }

  // Não é super_admin → manda pra home
  if (session.user.role !== "super_admin") {
    redirect("/");
  }

  return (
    <div className="bg-muted h-full flex">
      {/* Sidebar lateral */}
      <AdminSidebar />

      {/* Área principal */}
      <div className="lg:pl-[200px] w-full flex flex-col h-full">
        {/* Navbar superior */}
        <AdminNavbar />

        {/* Conteúdo da página */}
        <main className="flex-1 px-4 lg:px-8 pb-8 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}