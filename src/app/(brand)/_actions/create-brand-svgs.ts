"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { brandSvgs } from "@/db/schema";

interface SvgInput {
  url: string;
  fileName: string;
  fileSize: number;
}

interface CreateBrandSvgsInput {
  svgs: SvgInput[];
}

export async function createBrandSvgs(input: CreateBrandSvgsInput) {
  const session = await auth();

  if (!session?.user || session.user.role !== "brand_admin") {
    return { error: "Acesso negado" };
  }

  const brandId = session.user.brandId;
  if (!brandId) {
    return { error: "Marca nao identificada" };
  }

  if (!input.svgs || input.svgs.length === 0) {
    return { error: "Nenhum arquivo enviado" };
  }

  try {
    const inserted = await db
      .insert(brandSvgs)
      .values(
        input.svgs.map((svg) => ({
          brandId,
          url: svg.url,
          fileName: svg.fileName,
          fileSize: String(svg.fileSize),
          uploadedBy: session.user!.id,
        }))
      )
      .returning();

    revalidatePath("/brand/svgs");

    return {
      success: true,
      count: inserted.length,
    };
  } catch (error) {
    return { error: "Erro ao salvar vetores. Tente novamente." };
  }
}