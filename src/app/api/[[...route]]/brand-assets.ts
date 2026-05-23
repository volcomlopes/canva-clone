import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { verifyAuth } from "@hono/auth-js";

import { db } from "@/db/drizzle";
import { users, brandAssets } from "@/db/schema";

const app = new Hono().get("/", verifyAuth(), async (c) => {
  const auth = c.get("authUser");

  if (!auth.token?.id) {
    return c.json({ data: [] });
  }

  // Busca o brandId direto do banco pelo id do user logado
  const [dbUser] = await db
    .select({ brandId: users.brandId })
    .from(users)
    .where(eq(users.id, auth.token.id as string))
    .limit(1);

  if (!dbUser || !dbUser.brandId) {
    return c.json({ data: [] });
  }

  const data = await db
    .select()
    .from(brandAssets)
    .where(eq(brandAssets.brandId, dbUser.brandId))
    .orderBy(desc(brandAssets.createdAt));

  return c.json({ data });
});

export default app;