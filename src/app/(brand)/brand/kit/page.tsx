import { eq } from "drizzle-orm";
import { PaletteIcon } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { brandKits } from "@/db/schema";

import { BrandKitTabs } from "@/app/(brand)/_components/brand-kit-tabs";

interface ExtraColor {
  name: string;
  hex: string;
}

export default async function BrandKitPage() {
  const session = await auth();
  const brandId = session?.user?.brandId;

  let kit = null;

  if (brandId) {
    const [existing] = await db
      .select()
      .from(brandKits)
      .where(eq(brandKits.brandId, brandId))
      .limit(1);

    kit = existing || null;
  }

  // Parse das cores extras
  let extraColors: ExtraColor[] = [];
  if (kit?.colorsExtra) {
    try {
      extraColors = JSON.parse(kit.colorsExtra);
    } catch {
      extraColors = [];
    }
  }

  return (
    <div className="py-6 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-purple-50 rounded-md">
            <PaletteIcon className="size-5 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Brand Kit
          </h2>
        </div>
        <p className="text-slate-500 text-sm">
          Identidade visual da sua marca: cores, logos e fontes oficiais.
        </p>
      </div>

      <BrandKitTabs
        colors={{
          colorPrimary: kit?.colorPrimary || "#3B82F6",
          colorSecondary: kit?.colorSecondary || "#1F2937",
          colorText: kit?.colorText || "#0F172A",
          colorBackground: kit?.colorBackground || "#FFFFFF",
          colorAccent: kit?.colorAccent || "#94A3B8",
          colorsExtra: extraColors,
        }}
        logos={{
          logoPrimary: kit?.logoPrimary || null,
          logoMonoWhite: kit?.logoMonoWhite || null,
          logoMonoBlack: kit?.logoMonoBlack || null,
          logoHorizontal: kit?.logoHorizontal || null,
          logoVertical: kit?.logoVertical || null,
          favicon: kit?.favicon || null,
        }}
      />
    </div>
  );
}