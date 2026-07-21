import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { verifyAuth } from "@hono/auth-js";

import { db } from "@/db/drizzle";
import { users, brandSvgs } from "@/db/schema";

const app = new Hono().get("/", verifyAuth(), async (c) => {
  const auth = c.get("authUser");

  if (!auth.token?.id) {
    return c.json({ data: [] });
  }

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
    .from(brandSvgs)
    .where(eq(brandSvgs.brandId, dbUser.brandId))
    .orderBy(desc(brandSvgs.createdAt));

  return c.json({ data });
});

export default app;