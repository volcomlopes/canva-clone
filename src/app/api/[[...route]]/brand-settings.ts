import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { verifyAuth } from "@hono/auth-js";

import { db } from "@/db/drizzle";
import { users, brands } from "@/db/schema";

const app = new Hono().get("/", verifyAuth(), async (c) => {
  const auth = c.get("authUser");

  if (!auth.token?.id) {
    return c.json({ data: null });
  }

  const [dbUser] = await db
    .select({
      brandId: users.brandId,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, auth.token.id as string))
    .limit(1);

  if (!dbUser || !dbUser.brandId) {
    return c.json({ data: null });
  }

  const [brand] = await db
    .select({
      showTemplateControls: brands.showTemplateControls,
    })
    .from(brands)
    .where(eq(brands.id, dbUser.brandId))
    .limit(1);

  if (!brand) {
    return c.json({ data: null });
  }

  return c.json({
    data: {
      showTemplateControls: brand.showTemplateControls,
      userRole: dbUser.role,
    },
  });
});

export default app;