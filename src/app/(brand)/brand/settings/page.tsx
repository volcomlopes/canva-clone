import { eq } from "drizzle-orm";
import { SettingsIcon } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { brands } from "@/db/schema";

import { BrandSettingsForm } from "@/app/(brand)/_components/brand-settings-form";

export default async function BrandSettingsPage() {
  const session = await auth();
  const brandId = session?.user?.brandId;

  let brand = null;

  if (brandId) {
    const [existing] = await db
      .select()
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);

    brand = existing || null;
  }

  return (
    <div className="py-6 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-slate-100 rounded-md">
            <SettingsIcon className="size-5 text-slate-700" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Configurações
          </h2>
        </div>
        <p className="text-slate-500 text-sm">
          Preferências e comportamentos da sua marca no Artbase.
        </p>
      </div>

      <BrandSettingsForm
        initialSettings={{
          showTemplateControls: brand?.showTemplateControls || false,
        }}
      />
    </div>
  );
}