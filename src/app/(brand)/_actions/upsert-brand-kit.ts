"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { brandKits } from "@/db/schema";

interface ExtraColor {
  name: string;
  hex: string;
}

interface UpsertBrandKitInput {
  colorPrimary?: string;
  colorSecondary?: string;
  colorText?: string;
  colorBackground?: string;
  colorAccent?: string;
  colorsExtra?: ExtraColor[];
}

const isValidHex = (hex: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
};

export async function upsertBrandKit(input: UpsertBrandKitInput) {
  const session = await auth();

  if (!session?.user || session.user.role !== "brand_admin") {
    return { error: "Acesso negado" };
  }

  const brandId = session.user.brandId;
  if (!brandId) {
    return { error: "Marca nao identificada" };
  }

  // Valida cores fixas
  const colorFields = [
    input.colorPrimary,
    input.colorSecondary,
    input.colorText,
    input.colorBackground,
    input.colorAccent,
  ];

  for (const color of colorFields) {
    if (color && !isValidHex(color)) {
      return { error: `Cor invalida: ${color}` };
    }
  }

  // Valida cores extras
  if (input.colorsExtra) {
    for (const c of input.colorsExtra) {
      if (!isValidHex(c.hex)) {
        return { error: `Cor extra invalida: ${c.hex}` };
      }
      if (!c.name || c.name.trim().length === 0) {
        return { error: "Toda cor extra precisa de um nome" };
      }
    }
  }

  try {
    // Verifica se ja existe brand kit pra essa marca
    const [existing] = await db
      .select()
      .from(brandKits)
      .where(eq(brandKits.brandId, brandId))
      .limit(1);

    const values = {
      colorPrimary: input.colorPrimary,
      colorSecondary: input.colorSecondary,
      colorText: input.colorText,
      colorBackground: input.colorBackground,
      colorAccent: input.colorAccent,
      colorsExtra: input.colorsExtra
        ? JSON.stringify(input.colorsExtra)
        : undefined,
      updatedAt: new Date(),
    };

    if (existing) {
      // UPDATE
      await db
        .update(brandKits)
        .set(values)
        .where(eq(brandKits.brandId, brandId));
    } else {
      // INSERT
      await db.insert(brandKits).values({
        brandId,
        ...values,
      });
    }

    revalidatePath("/brand/kit");

    return { success: true };
  } catch (error) {
    return { error: "Erro ao salvar Brand Kit" };
  }
}