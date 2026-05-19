import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BrandSidebar } from "./_components/brand-sidebar";
import { BrandNavbar } from "./_components/brand-navbar";

interface BrandLayoutProps {
  children: React.ReactNode;
}

export default async function BrandLayout({ children }: BrandLayoutProps) {
  const session = await auth();

  // Não logado → login
  if (!session?.user) {
    redirect("/sign-in");
  }

  // Não é brand_admin → redireciona conforme role
  if (session.user.role !== "brand_admin") {
    // Super admin vai pra /admin
    if (session.user.role === "super_admin") {
      redirect("/admin");
    }
    // Outros vão pra home
    redirect("/");
  }

  // Brand admin sem brandId associado = erro
  if (!session.user.brandId) {
    redirect("/");
  }

  return (
    <div className="bg-muted h-full flex">
      <BrandSidebar />
      <div className="lg:pl-[200px] w-full flex flex-col h-full">
        <BrandNavbar />
        <main className="flex-1 px-4 lg:px-8 pb-8 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}