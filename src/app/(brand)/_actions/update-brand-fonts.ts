"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { brandKits } from "@/db/schema";
import { GOOGLE_FONTS } from "@/features/brand-kit/google-fonts";

interface UpdateBrandFontsInput {
  fontHeading?: string | null;
  fontSubheading?: string | null;
  fontBody?: string | null;
  fontHighlight?: string | null;
}

const isValidFont = (fontName: string | null | undefined): boolean => {
  if (!fontName) return true; // null e valido (limpar slot)
  return GOOGLE_FONTS.some((f) => f.name === fontName);
};

export async function updateBrandFonts(input: UpdateBrandFontsInput) {
  const session = await auth();

  if (!session?.user || session.user.role !== "brand_admin") {
    return { error: "Acesso negado" };
  }

  const brandId = session.user.brandId;
  if (!brandId) {
    return { error: "Marca nao identificada" };
  }

  // Valida cada fonte (se passada)
  const slots: (keyof UpdateBrandFontsInput)[] = [
    "fontHeading",
    "fontSubheading",
    "fontBody",
    "fontHighlight",
  ];

  for (const slot of slots) {
    if (input[slot] !== undefined && !isValidFont(input[slot])) {
      return { error: `Fonte invalida: ${input[slot]}` };
    }
  }

  try {
    const [existing] = await db
      .select()
      .from(brandKits)
      .where(eq(brandKits.brandId, brandId))
      .limit(1);

    const values = {
      fontHeading: input.fontHeading,
      fontSubheading: input.fontSubheading,
      fontBody: input.fontBody,
      fontHighlight: input.fontHighlight,
      updatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(brandKits)
        .set(values)
        .where(eq(brandKits.brandId, brandId));
    } else {
      await db.insert(brandKits).values({
        brandId,
        ...values,
      });
    }

    revalidatePath("/brand/kit");

    return { success: true };
  } catch (error) {
    return { error: "Erro ao salvar fontes" };
  }
}