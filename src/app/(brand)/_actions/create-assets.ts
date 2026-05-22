"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { brandAssets } from "@/db/schema";

interface AssetInput {
  url: string;
  fileName: string;
  fileSize: number;
  category: string;
}

interface CreateAssetsInput {
  assets: AssetInput[];
}

export async function createAssets(input: CreateAssetsInput) {
  const session = await auth();

  if (!session?.user || session.user.role !== "brand_admin") {
    return { error: "Acesso negado" };
  }

  const brandId = session.user.brandId;
  if (!brandId) {
    return { error: "Marca nao identificada" };
  }

  if (!input.assets || input.assets.length === 0) {
    return { error: "Nenhum arquivo enviado" };
  }

  try {
    const inserted = await db
      .insert(brandAssets)
      .values(
        input.assets.map((asset) => ({
          brandId,
          url: asset.url,
          category: asset.category,
          fileName: asset.fileName,
          fileSize: String(asset.fileSize),
          uploadedBy: session.user!.id,
        }))
      )
      .returning();

    revalidatePath("/brand/assets");

    return {
      success: true,
      count: inserted.length,
    };
  } catch (error) {
    return { error: "Erro ao salvar assets. Tente novamente." };
  }
}