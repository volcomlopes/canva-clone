import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { verifyAuth } from "@hono/auth-js";

import { db } from "@/db/drizzle";
import { users, brandKits } from "@/db/schema";

const app = new Hono().get("/", verifyAuth(), async (c) => {
  const auth = c.get("authUser");

  if (!auth.token?.id) {
    return c.json({ data: null });
  }

  const [dbUser] = await db
    .select({ brandId: users.brandId })
    .from(users)
    .where(eq(users.id, auth.token.id as string))
    .limit(1);

  if (!dbUser || !dbUser.brandId) {
    return c.json({ data: null });
  }

  const [kit] = await db
    .select()
    .from(brandKits)
    .where(eq(brandKits.brandId, dbUser.brandId))
    .limit(1);

  if (!kit) {
    return c.json({ data: null });
  }

  let extraColors: { name: string; hex: string }[] = [];
  if (kit.colorsExtra) {
    try {
      extraColors = JSON.parse(kit.colorsExtra);
    } catch {
      extraColors = [];
    }
  }

  return c.json({
    data: {
      colorPrimary: kit.colorPrimary,
      colorSecondary: kit.colorSecondary,
      colorText: kit.colorText,
      colorBackground: kit.colorBackground,
      colorAccent: kit.colorAccent,
      colorsExtra: extraColors,
      logoPrimary: kit.logoPrimary,
      logoMonoWhite: kit.logoMonoWhite,
      logoMonoBlack: kit.logoMonoBlack,
      logoHorizontal: kit.logoHorizontal,
      logoVertical: kit.logoVertical,
      favicon: kit.favicon,
      fontHeading: kit.fontHeading,
      fontSubheading: kit.fontSubheading,
      fontBody: kit.fontBody,
      fontHighlight: kit.fontHighlight,
    },
  });
});

export default app;