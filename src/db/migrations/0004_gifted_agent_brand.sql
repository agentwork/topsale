CREATE TYPE "public"."change_type" AS ENUM('top-up', 'reduction');--> statement-breakpoint
CREATE TYPE "public"."quotation_status" AS ENUM('draft', 'pending_approval', 'approved', 'confirmed', 'closed', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('pending', 'accepted', 'processing', 'completed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."ticket_type" AS ENUM('am_strategy', 'am_data', 'pm_custom', 'as_material_confirm', 'ds_proposal', 'ds_material', 'rd_tech_support', 'mb_media_purchase');--> statement-breakpoint
CREATE TABLE "quotation_invoice_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"est_month" text NOT NULL,
	"est_amount" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"days" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"budget" integer NOT NULL,
	"est_impressions" integer,
	"est_clicks" integer,
	"est_views" integer,
	"est_ctr" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_revision_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"revision_no" integer NOT NULL,
	"change_type" "change_type" NOT NULL,
	"old_amount" integer NOT NULL,
	"new_amount" integer NOT NULL,
	"lark_approval_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_targeting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"media_cat" text[],
	"demo_age" text[],
	"demo_gender" text,
	"geo_location" text[],
	"income" text[],
	"family" text[],
	"occupation" text[],
	"interests" text[],
	"fp_site_type" text,
	"fp_site_url" text,
	"fp_app_category" text,
	"fp_apps" text,
	"consumer_data" text,
	"interact_ad" text,
	"interact_site" text,
	"interact_app" text,
	"audience_pkg" text,
	"crm_adid" text,
	"context_keywords" text,
	"brand_safety" text,
	"third_party_audit" text[],
	"data_loop" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quotation_targeting_quotation_id_unique" UNIQUE("quotation_id")
);
--> statement-breakpoint
CREATE TABLE "quotation_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"lark_ticket_id" text NOT NULL,
	"ticket_type" "ticket_type" NOT NULL,
	"ticket_status" "ticket_status" DEFAULT 'pending' NOT NULL,
	"assignee_name" text,
	"deep_link" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_no" text NOT NULL,
	"quotation_date" date NOT NULL,
	"valid_until" date NOT NULL,
	"campaign_name" text NOT NULL,
	"agency_id" uuid,
	"customer_id" uuid NOT NULL,
	"brand_ids" uuid[] NOT NULL,
	"owner_id" uuid NOT NULL,
	"contact_phone" text,
	"status" "quotation_status" DEFAULT 'draft' NOT NULL,
	"is_rush_order" boolean DEFAULT false,
	"is_special_case" boolean DEFAULT false,
	"subtotal_net" integer DEFAULT 0,
	"tax_amount" integer DEFAULT 0,
	"total_gross" integer DEFAULT 0,
	"final_net" integer,
	"lark_approval_id" text,
	"approved_at" timestamp,
	"approved_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quotations_quotation_no_unique" UNIQUE("quotation_no")
);
--> statement-breakpoint
ALTER TABLE "quotation_invoice_plans" ADD CONSTRAINT "quotation_invoice_plans_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_line_items" ADD CONSTRAINT "quotation_line_items_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_revision_log" ADD CONSTRAINT "quotation_revision_log_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_targeting" ADD CONSTRAINT "quotation_targeting_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_tickets" ADD CONSTRAINT "quotation_tickets_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;