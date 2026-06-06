import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/auth";

const f = createUploadthing();

export const ourFileRouter = {
  // Rota existente do editor (NAO MEXER)
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      const session = await auth();
      if (!session) throw new UploadThingError("Unauthorized");
      return { userId: session.user?.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url };
    }),

  // Rota: upload em massa de assets da marca
  brandAssetsUploader: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 20,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth();

      if (!session?.user) {
        throw new UploadThingError("Unauthorized");
      }

      if (session.user.role !== "brand_admin") {
        throw new UploadThingError("Apenas admins da marca podem subir assets");
      }

      if (!session.user.brandId) {
        throw new UploadThingError("Marca nao identificada");
      }

      return {
        userId: session.user.id,
        brandId: session.user.brandId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        url: file.url,
        name: file.name,
        size: file.size,
        brandId: metadata.brandId,
        uploadedBy: metadata.userId,
      };
    }),

  // Rota: upload de logos da marca (1 arquivo por vez, aceita SVG)
  brandLogosUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth();

      if (!session?.user) {
        throw new UploadThingError("Unauthorized");
      }

      if (session.user.role !== "brand_admin") {
        throw new UploadThingError("Apenas admins da marca podem subir logos");
      }

      if (!session.user.brandId) {
        throw new UploadThingError("Marca nao identificada");
      }

      return {
        userId: session.user.id,
        brandId: session.user.brandId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        url: file.url,
        name: file.name,
        size: file.size,
        brandId: metadata.brandId,
      };
    }),

  // Rota: thumbnail de templates (gerado automaticamente ao salvar template)
  templateThumbnailUploader: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth();

      if (!session?.user) {
        throw new UploadThingError("Unauthorized");
      }

      if (!session.user.brandId) {
        throw new UploadThingError("Marca nao identificada");
      }

      // Qualquer role pode gerar thumb (admin gera oficiais, vendedor gera pessoais)
      return {
        userId: session.user.id,
        brandId: session.user.brandId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        url: file.url,
        brandId: metadata.brandId,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;