"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { brandKits } from "@/db/schema";

type LogoType =
  | "logoPrimary"
  | "logoMonoWhite"
  | "logoMonoBlack"
  | "logoHorizontal"
  | "logoVertical"
  | "favicon";

interface UpdateBrandLogoInput {
  logoType: LogoType;
  url: string | null;
}

const VALID_LOGO_TYPES: LogoType[] = [
  "logoPrimary",
  "logoMonoWhite",
  "logoMonoBlack",
  "logoHorizontal",
  "logoVertical",
  "favicon",
];

export async function updateBrandLogo(input: UpdateBrandLogoInput) {
  const session = await auth();

  if (!session?.user || session.user.role !== "brand_admin") {
    return { error: "Acesso negado" };
  }

  const brandId = session.user.brandId;
  if (!brandId) {
    return { error: "Marca nao identificada" };
  }

  if (!VALID_LOGO_TYPES.includes(input.logoType)) {
    return { error: "Tipo de logo invalido" };
  }

  try {
    // Verifica se ja existe brand kit
    const [existing] = await db
      .select()
      .from(brandKits)
      .where(eq(brandKits.brandId, brandId))
      .limit(1);

    if (existing) {
      // UPDATE
      await db
        .update(brandKits)
        .set({
          [input.logoType]: input.url,
          updatedAt: new Date(),
        })
        .where(eq(brandKits.brandId, brandId));
    } else {
      // INSERT (cria brand kit com so esse logo)
      await db.insert(brandKits).values({
        brandId,
        [input.logoType]: input.url,
      });
    }

    revalidatePath("/brand/kit");

    return { success: true };
  } catch (error) {
    return { error: "Erro ao salvar logo" };
  }
}