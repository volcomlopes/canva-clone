"use server";

import { revalidatePath } from "next/cache";
import { eq, and, asc } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { templateCategories, projects } from "@/db/schema";

// Roles que podem GERENCIAR pastas (criar/renomear/excluir/mover).
// Pra liberar dealership_admin no futuro: adicione "dealership_admin" aqui.
const ALLOWED_ROLES = ["brand_admin", "super_admin"];

// Contexto pra GERENCIAR: exige role de admin.
async function getBrandContext() {
  const session = await auth();

  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    return { error: "Acesso negado" as const };
  }

  const brandId = session.user.brandId;
  if (!brandId) {
    return { error: "Marca nao identificada" as const };
  }

  return { brandId };
}

// Contexto pra LER: qualquer usuario com brandId (inclui vendedor).
// Ver as pastas ajuda a se localizar; nao permite gerenciar.
async function getReadContext() {
  const session = await auth();

  if (!session?.user) {
    return { error: "Acesso negado" as const };
  }

  const brandId = session.user.brandId;
  if (!brandId) {
    return { error: "Marca nao identificada" as const };
  }

  return { brandId };
}

// ============================================
// LISTAR pastas da marca (com contagem de templates)
// ============================================
export async function listTemplateCategories() {
  const ctx = await getReadContext();
  if ("error" in ctx) return ctx;

  const categories = await db
    .select()
    .from(templateCategories)
    .where(eq(templateCategories.brandId, ctx.brandId))
    .orderBy(asc(templateCategories.position), asc(templateCategories.createdAt));

  return { success: true as const, categories };
}

// ============================================
// CRIAR pasta
// ============================================
export async function createTemplateCategory(input: { name: string }) {
  const ctx = await getBrandContext();
  if ("error" in ctx) return ctx;

  const name = (input.name || "").trim();
  if (!name) {
    return { error: "Digite um nome para a pasta" };
  }
  if (name.length > 40) {
    return { error: "Nome muito longo (max 40 caracteres)" };
  }

  // Evita duplicata de nome na mesma marca
  const [existing] = await db
    .select()
    .from(templateCategories)
    .where(
      and(
        eq(templateCategories.brandId, ctx.brandId),
        eq(templateCategories.name, name)
      )
    )
    .limit(1);

  if (existing) {
    return { error: "Ja existe uma pasta com esse nome" };
  }

  try {
    const [created] = await db
      .insert(templateCategories)
      .values({
        brandId: ctx.brandId,
        name,
      })
      .returning();

    revalidatePath("/");
    revalidatePath("/brand");

    return { success: true as const, category: created };
  } catch {
    return { error: "Erro ao criar pasta. Tente novamente." };
  }
}

// ============================================
// RENOMEAR pasta
// ============================================
export async function renameTemplateCategory(input: {
  id: string;
  name: string;
}) {
  const ctx = await getBrandContext();
  if ("error" in ctx) return ctx;

  const name = (input.name || "").trim();
  if (!name) {
    return { error: "Digite um nome para a pasta" };
  }
  if (name.length > 40) {
    return { error: "Nome muito longo (max 40 caracteres)" };
  }

  // Confirma que a pasta pertence a marca do usuario
  const [category] = await db
    .select()
    .from(templateCategories)
    .where(
      and(
        eq(templateCategories.id, input.id),
        eq(templateCategories.brandId, ctx.brandId)
      )
    )
    .limit(1);

  if (!category) {
    return { error: "Pasta nao encontrada" };
  }

  try {
    await db
      .update(templateCategories)
      .set({ name, updatedAt: new Date() })
      .where(eq(templateCategories.id, input.id));

    revalidatePath("/");
    revalidatePath("/brand");

    return { success: true as const };
  } catch {
    return { error: "Erro ao renomear. Tente novamente." };
  }
}

// ============================================
// EXCLUIR pasta (templates dentro voltam para "Sem categoria")
// ============================================
export async function deleteTemplateCategory(input: { id: string }) {
  const ctx = await getBrandContext();
  if ("error" in ctx) return ctx;

  const [category] = await db
    .select()
    .from(templateCategories)
    .where(
      and(
        eq(templateCategories.id, input.id),
        eq(templateCategories.brandId, ctx.brandId)
      )
    )
    .limit(1);

  if (!category) {
    return { error: "Pasta nao encontrada" };
  }

  try {
    // Solta os templates dessa pasta (viram "sem categoria")
    await db
      .update(projects)
      .set({ templateCategoryId: null })
      .where(
        and(
          eq(projects.templateCategoryId, input.id),
          eq(projects.brandId, ctx.brandId)
        )
      );

    // Remove a pasta
    await db
      .delete(templateCategories)
      .where(eq(templateCategories.id, input.id));

    revalidatePath("/");
    revalidatePath("/brand");

    return { success: true as const };
  } catch {
    return { error: "Erro ao excluir. Tente novamente." };
  }
}

// ============================================
// MOVER template para uma pasta (ou tirar da pasta com categoryId null)
// ============================================
export async function moveTemplateToCategory(input: {
  templateId: string;
  categoryId: string | null;
}) {
  const ctx = await getBrandContext();
  if ("error" in ctx) return ctx;

  // Confirma que o template pertence a marca e e template mesmo
  const [template] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, input.templateId),
        eq(projects.brandId, ctx.brandId)
      )
    )
    .limit(1);

  if (!template) {
    return { error: "Template nao encontrado" };
  }

  // Se veio uma pasta, confirma que ela e da mesma marca
  if (input.categoryId) {
    const [category] = await db
      .select()
      .from(templateCategories)
      .where(
        and(
          eq(templateCategories.id, input.categoryId),
          eq(templateCategories.brandId, ctx.brandId)
        )
      )
      .limit(1);

    if (!category) {
      return { error: "Pasta invalida" };
    }
  }

  try {
    await db
      .update(projects)
      .set({ templateCategoryId: input.categoryId })
      .where(eq(projects.id, input.templateId));

    revalidatePath("/");
    revalidatePath("/brand");

    return { success: true as const };
  } catch {
    return { error: "Erro ao mover template. Tente novamente." };
  }
}