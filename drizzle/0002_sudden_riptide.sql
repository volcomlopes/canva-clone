CREATE TABLE IF NOT EXISTS "brandAsset" (
	"id" text PRIMARY KEY NOT NULL,
	"brandId" text NOT NULL,
	"url" text NOT NULL,
	"category" text,
	"fileName" text,
	"fileSize" text,
	"uploadedBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brandKit" (
	"id" text PRIMARY KEY NOT NULL,
	"brandId" text NOT NULL,
	"colorPrimary" text DEFAULT '#3B82F6',
	"colorSecondary" text DEFAULT '#1F2937',
	"colorText" text DEFAULT '#0F172A',
	"colorBackground" text DEFAULT '#FFFFFF',
	"colorAccent" text DEFAULT '#94A3B8',
	"colorsExtra" text DEFAULT '[]',
	"logoPrimary" text,
	"logoMonoWhite" text,
	"logoMonoBlack" text,
	"logoHorizontal" text,
	"logoVertical" text,
	"favicon" text,
	"fontHeading" text,
	"fontSubheading" text,
	"fontBody" text,
	"fontHighlight" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brandKit_brandId_unique" UNIQUE("brandId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "templateCategory" (
	"id" text PRIMARY KEY NOT NULL,
	"brandId" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand" ADD COLUMN "showTemplateControls" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "templateVisibility" text DEFAULT 'personal';--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "sourceTemplateId" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "templateChildId" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "templateCategoryId" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brandAsset" ADD CONSTRAINT "brandAsset_brandId_brand_id_fk" FOREIGN KEY ("brandId") REFERENCES "public"."brand"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brandAsset" ADD CONSTRAINT "brandAsset_uploadedBy_user_id_fk" FOREIGN KEY ("uploadedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brandKit" ADD CONSTRAINT "brandKit_brandId_brand_id_fk" FOREIGN KEY ("brandId") REFERENCES "public"."brand"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "templateCategory" ADD CONSTRAINT "templateCategory_brandId_brand_id_fk" FOREIGN KEY ("brandId") REFERENCES "public"."brand"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
