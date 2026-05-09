CREATE TABLE "product_ad_extensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"device" text,
	"placement" text,
	"format" text,
	"size" text,
	"creative_format" text,
	"ctr_min" integer,
	"ctr_max" integer,
	"er_min" integer,
	"er_max" integer,
	"vtr_min" integer,
	"vtr_max" integer,
	"pmp_features" jsonb,
	"leading_ctr_min" integer,
	"leading_ctr_max" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_ad_extensions_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "product_package_extensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"traffic_bonus" text,
	"creative_bonus" text,
	"threshold" integer,
	"constraints" text,
	"composition" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_package_extensions_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "product_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"changed_field" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"changed_by" text NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_code" text,
	"ragic_id" text,
	"main_code" text NOT NULL,
	"sub_category" text NOT NULL,
	"product_name" text NOT NULL,
	"product_name_en" text,
	"description" text,
	"pricing_unit" text NOT NULL,
	"unit_price" integer NOT NULL,
	"priority" integer DEFAULT 0,
	"start_date" date,
	"end_date" date,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	CONSTRAINT "product_catalog_product_code_unique" UNIQUE("product_code")
);
--> statement-breakpoint
CREATE TABLE "product_service_extensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"content_description" text,
	"notes" text,
	"revision_limit" integer,
	"delivery_time" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_service_extensions_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
ALTER TABLE "product_ad_extensions" ADD CONSTRAINT "product_ad_extensions_product_id_product_catalog_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_package_extensions" ADD CONSTRAINT "product_package_extensions_product_id_product_catalog_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_history" ADD CONSTRAINT "product_history_product_id_product_catalog_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_service_extensions" ADD CONSTRAINT "product_service_extensions_product_id_product_catalog_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product_catalog"("id") ON DELETE no action ON UPDATE no action;