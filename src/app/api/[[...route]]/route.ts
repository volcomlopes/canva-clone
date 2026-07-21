import { Context, Hono } from "hono";
import { handle } from "hono/vercel";
import { AuthConfig, initAuthConfig } from "@hono/auth-js";

import ai from "./ai";
import users from "./users";
import images from "./images";
import projects from "./projects";
import subscriptions from "./subscriptions";
import brandAssets from "./brand-assets";
import brandSvgs from "./brand-svgs";
import brandKit from "./brand-kit";
import brandSettings from "./brand-settings";

import authConfig from "@/auth.config";

export const runtime = "nodejs";

function getAuthConfig(c: Context): AuthConfig {
  return {
    secret: c.env.AUTH_SECRET,
    ...authConfig
  };
};

const app = new Hono().basePath("/api");

app.use("*", initAuthConfig(getAuthConfig));

const routes = app
  .route("/ai", ai)
  .route("/users", users)
  .route("/images", images)
  .route("/projects", projects)
  .route("/subscriptions", subscriptions)
  .route("/brand-assets", brandAssets)
  .route("/brand-svgs", brandSvgs)
  .route("/brand-kit", brandKit)
  .route("/brand-settings", brandSettings);

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;