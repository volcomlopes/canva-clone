import { z } from "zod";
import { Hono } from "hono";
import { eq, and, or, desc, asc } from "drizzle-orm";
import { verifyAuth } from "@hono/auth-js";
import { zValidator } from "@hono/zod-validator";

import { db } from "@/db/drizzle";
import { projects, projectsInsertSchema, users } from "@/db/schema";

const app = new Hono()
  .get(
    "/templates",
    verifyAuth(),
    zValidator(
      "query",
      z.object({
        page: z.coerce.number(),
        limit: z.coerce.number(),
      }),
    ),
    async (c) => {
      const auth = c.get("authUser");
      const { page, limit } = c.req.valid("query");

      if (!auth.token?.id) {
        return c.json({ data: [] });
      }

      const [dbUser] = await db
        .select({ brandId: users.brandId })
        .from(users)
        .where(eq(users.id, auth.token.id as string))
        .limit(1);

      if (!dbUser?.brandId) {
        return c.json({ data: [] });
      }

      // Lista templates: oficiais da marca + pessoais do proprio usuario
      const data = await db
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.isTemplate, true),
            eq(projects.brandId, dbUser.brandId),
            or(
              eq(projects.templateVisibility, "official"),
              and(
                eq(projects.templateVisibility, "personal"),
                eq(projects.userId, auth.token.id as string),
              )
            ),
          )
        )
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(
          asc(projects.isPro),
          desc(projects.updatedAt),
        );

      return c.json({ data });
    },
  )
  .delete(
    "/:id",
    verifyAuth(),
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const auth = c.get("authUser");
      const { id } = c.req.valid("param");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Busca role e brandId
      const [dbUser] = await db
        .select({ brandId: users.brandId, role: users.role })
        .from(users)
        .where(eq(users.id, auth.token.id as string))
        .limit(1);

      // Busca o projeto/template alvo
      const [target] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id))
        .limit(1);

      if (!target) {
        return c.json({ error: "Not found" }, 404);
      }

      const isAdmin = dbUser?.role === "brand_admin" || dbUser?.role === "super_admin";
      const isOwner = target.userId === auth.token.id;
      const isSameBrand = target.brandId === dbUser?.brandId;

      // REGRAS DE PERMISSAO:
      // 1. Templates oficiais: so admin da MESMA marca pode deletar
      // 2. Templates pessoais: so o criador pode deletar
      // 3. Projetos normais: so o criador pode deletar
      if (target.isTemplate) {
        if (target.templateVisibility === "official") {
          if (!isAdmin || !isSameBrand) {
            return c.json({ error: "Sem permissao para deletar template oficial" }, 403);
          }
        } else {
          // Template pessoal
          if (!isOwner) {
            return c.json({ error: "Sem permissao para deletar template pessoal de outro usuario" }, 403);
          }
        }
      } else {
        // Projeto normal
        if (!isOwner) {
          return c.json({ error: "Sem permissao" }, 403);
        }
      }

      await db.delete(projects).where(eq(projects.id, id));

      return c.json({ data: { id } });
    },
  )
  .post(
    "/:id/duplicate",
    verifyAuth(),
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const auth = c.get("authUser");
      const { id } = c.req.valid("param");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data = await db
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.id, id),
            eq(projects.userId, auth.token.id),
          ),
        );

      if (data.length === 0) {
        return c.json({ error: "Not found" }, 404);
      }

      const project = data[0];

      const duplicateData = await db
        .insert(projects)
        .values({
          name: `Copy of ${project.name}`,
          json: project.json,
          width: project.width,
          height: project.height,
          userId: auth.token.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json({ data: duplicateData[0] });
    },
  )
  .get(
    "/",
    verifyAuth(),
    zValidator(
      "query",
      z.object({
        page: z.coerce.number(),
        limit: z.coerce.number(),
      }),
    ),
    async (c) => {
      const auth = c.get("authUser");
      const { page, limit } = c.req.valid("query");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, auth.token.id))
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(projects.updatedAt));

      return c.json({
        data,
        nextPage: data.length === limit ? page + 1 : null,
      });
    },
  )
  .patch(
    "/:id",
    verifyAuth(),
    zValidator(
      "param",
      z.object({ id: z.string() }),
    ),
    zValidator(
      "json",
      projectsInsertSchema
        .omit({
          id: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        })
        .partial()
    ),
    async (c) => {
      const auth = c.get("authUser");
      const { id } = c.req.valid("param");
      const values = c.req.valid("json");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Busca role e brandId
      const [dbUser] = await db
        .select({ brandId: users.brandId, role: users.role })
        .from(users)
        .where(eq(users.id, auth.token.id as string))
        .limit(1);

      // Busca o projeto/template alvo
      const [target] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id))
        .limit(1);

      if (!target) {
        return c.json({ error: "Not found" }, 404);
      }

      const isAdmin = dbUser?.role === "brand_admin" || dbUser?.role === "super_admin";
      const isOwner = target.userId === auth.token.id;
      const isSameBrand = target.brandId === dbUser?.brandId;

      // REGRAS DE PERMISSAO:
      // 1. Template oficial: so admin da MESMA marca
      // 2. Template pessoal: so o criador
      // 3. Projeto normal: so o criador
      if (target.isTemplate) {
        if (target.templateVisibility === "official") {
          if (!isAdmin || !isSameBrand) {
            return c.json({ error: "Sem permissao" }, 403);
          }
        } else {
          if (!isOwner) {
            return c.json({ error: "Sem permissao" }, 403);
          }
        }
      } else {
        if (!isOwner) {
          return c.json({ error: "Sem permissao" }, 403);
        }
      }

      const data = await db
        .update(projects)
        .set({
          ...values,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning();

      return c.json({ data: data[0] });
    },
  )
  .get(
    "/:id",
    verifyAuth(),
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const auth = c.get("authUser");
      const { id } = c.req.valid("param");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Busca o brandId do usuario logado
      const [dbUser] = await db
        .select({ brandId: users.brandId })
        .from(users)
        .where(eq(users.id, auth.token.id as string))
        .limit(1);

      // Busca o projeto pelo id
      const [target] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id))
        .limit(1);

      if (!target) {
        return c.json({ error: "Not found" }, 404);
      }

      const isOwner = target.userId === auth.token.id;

      // Template oficial da MESMA marca: pode ler (mesmo nao sendo dono).
      // Isso permite ao vendedor ler metadados do template de origem
      // (ex: pagesLocked) sem poder edita-lo.
      const isOfficialSameBrand =
        target.isTemplate === true &&
        target.templateVisibility === "official" &&
        !!target.brandId &&
        target.brandId === dbUser?.brandId;

      if (!isOwner && !isOfficialSameBrand) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data: target });
    },
  )
  
  .post(
    "/",
    verifyAuth(),
    zValidator(
      "json",
      projectsInsertSchema.pick({
        name: true,
        json: true,
        width: true,
        height: true,
      }),
    ),
    async (c) => {
      const auth = c.get("authUser");
      const { name, json, height, width } = c.req.valid("json");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data = await db
        .insert(projects)
        .values({
          name,
          json,
          width,
          height,
          userId: auth.token.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!data[0]) {
        return c.json({ error: "Something went wrong" }, 400);
      }

      return c.json({ data: data[0] });
    },
  )
  .post(
    "/:id/save-as-template",
    verifyAuth(),
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const auth = c.get("authUser");
      const { id } = c.req.valid("param");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Garante que todos os elementos tenham isEditable definido (default: false = travado)
      const ensureEditableDefaults = function (jsonString: string): string {
        try {
          const parsed = JSON.parse(jsonString);
          if (parsed && Array.isArray(parsed.objects)) {
            parsed.objects.forEach(function (obj: any) {
              if (obj && obj.name !== "clip" && typeof obj.isEditable !== "boolean") {
                obj.isEditable = false;
              }
            });
            return JSON.stringify(parsed);
          }
          return jsonString;
        } catch {
          // Se falhar parse, retorna como veio (nao bloqueia o save)
          return jsonString;
        }
      };

      let body: {
        name?: string;
        mode?: "create" | "update";
        targetTemplateId?: string;
        thumbnailUrl?: string;
        categoryId?: string | null;
        pagesLocked?: boolean;
      };
      try {
        body = await c.req.json();
      } catch {
        return c.json({ error: "Body invalido" }, 400);
      }

      const mode = body.mode === "update" ? "update" : "create";

        
      // Busca role e brandId
      const [dbUser] = await db
        .select({ brandId: users.brandId, role: users.role })
        .from(users)
        .where(eq(users.id, auth.token.id as string))
        .limit(1);

      if (!dbUser?.brandId) {
        return c.json({ error: "Marca nao identificada" }, 400);
      }

      // Define visibility baseado no role
      const isAdmin = dbUser.role === "brand_admin" || dbUser.role === "super_admin";
      const visibility = isAdmin ? "official" : "personal";

      // Busca projeto original
      const [project] = await db
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.id, id),
            eq(projects.userId, auth.token.id),
          ),
        )
        .limit(1);

      if (!project) {
        return c.json({ error: "Projeto nao encontrado" }, 404);
      }

      // MODO ATUALIZAR
      if (mode === "update") {
        // Define qual template atualizar:
        // 1. Se enviou targetTemplateId, usa esse (projeto-filho atualiza template de origem)
        // 2. Senao usa templateChildId (projeto-pai atualiza template gerado)
        const targetId = body.targetTemplateId || project.templateChildId;

                 
        if (!targetId) {
          return c.json({ error: "Nenhum template vinculado" }, 400);
        }

        // Busca template alvo
        const [existingTemplate] = await db
          .select()
          .from(projects)
          .where(
            and(
              eq(projects.id, targetId),
              eq(projects.isTemplate, true),
              eq(projects.brandId, dbUser.brandId),
            ),
          )
          .limit(1);

        if (!existingTemplate) {
          return c.json({ error: "Template nao encontrado" }, 404);
        }

        // Regra de permissao:
        // - Templates oficiais: so admin atualiza
        // - Templates pessoais: so o criador atualiza
        if (existingTemplate.templateVisibility === "official" && !isAdmin) {
          return c.json({ error: "Sem permissao para atualizar template oficial" }, 403);
        }
        if (
          existingTemplate.templateVisibility === "personal" &&
          existingTemplate.userId !== auth.token.id
        ) {
          return c.json({ error: "Sem permissao para atualizar template pessoal de outro usuario" }, 403);
        }

        // Atualiza
        const [updated] = await db
          .update(projects)
          .set({
            json: ensureEditableDefaults(project.json),
            width: project.width,
            height: project.height,
            thumbnailUrl: body.thumbnailUrl || project.thumbnailUrl,
            pagesLocked: body.pagesLocked ?? false,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, targetId))
          .returning();

        return c.json({ data: updated, mode: "update" });
      }

      // MODO CRIAR
      const name = body.name?.trim();

      if (!name || name.length === 0) {
        return c.json({ error: "Nome obrigatorio" }, 400);
      }

      if (name.length > 100) {
        return c.json({ error: "Nome muito longo (max 100)" }, 400);
      }

      // Cria template com visibility correta
      const [template] = await db
        .insert(projects)
        .values({
          name: name,
          json: ensureEditableDefaults(project.json),
          width: project.width,
          height: project.height,
          thumbnailUrl: body.thumbnailUrl || project.thumbnailUrl,
          userId: auth.token.id,
          brandId: dbUser.brandId,
          isTemplate: true,
          isPro: false,
          templateVisibility: visibility,
          templateCategoryId: body.categoryId ?? null,
          pagesLocked: body.pagesLocked ?? false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Vincula projeto ao novo template
      await db
        .update(projects)
        .set({
          templateChildId: template.id,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id));

      return c.json({ data: template, mode: "create" });
    },
  )
  .post(
    "/:id/duplicate-from-template",
    verifyAuth(),
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const auth = c.get("authUser");
      const { id } = c.req.valid("param");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [dbUser] = await db
        .select({ brandId: users.brandId })
        .from(users)
        .where(eq(users.id, auth.token.id as string))
        .limit(1);

      if (!dbUser?.brandId) {
        return c.json({ error: "Marca nao identificada" }, 400);
      }

      // Busca template (oficial OU pessoal do usuario)
      const [template] = await db
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.id, id),
            eq(projects.isTemplate, true),
            eq(projects.brandId, dbUser.brandId),
            or(
              eq(projects.templateVisibility, "official"),
              and(
                eq(projects.templateVisibility, "personal"),
                eq(projects.userId, auth.token.id as string),
              )
            ),
          ),
        )
        .limit(1);

      if (!template) {
        return c.json({ error: "Template nao encontrado" }, 404);
      }

      const [newProject] = await db
        .insert(projects)
        .values({
          name: template.name,
          json: template.json,
          width: template.width,
          height: template.height,
          thumbnailUrl: template.thumbnailUrl,
          userId: auth.token.id,
          brandId: dbUser.brandId,
          isTemplate: false,
          isPro: false,
          sourceTemplateId: template.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json({ data: newProject });
    },
  );

export default app;