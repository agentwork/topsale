CREATE TABLE "crm_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_name" text NOT NULL,
	"short_name" text NOT NULL,
	"tax_id" text,
	"personal_id" text,
	"address" text NOT NULL,
	"group_id" uuid,
	"account_type" text NOT NULL,
	"agency_tier" text,
	"contract_url" text,
	"account_owner" uuid,
	"primary_contact_id" uuid,
	"customer_preference" text,
	"internal_politics" text,
	"payment_term" text NOT NULL,
	"alliance" text,
	"is_blacklist" boolean DEFAULT false,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_agency_brand_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_account_id" uuid NOT NULL,
	"client_brand_id" uuid NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "crm_brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_name" text NOT NULL,
	"account_id" uuid NOT NULL,
	"industry_category" text NOT NULL,
	"media_requirement" text[],
	"delivery_notes" text,
	"cooperation_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_contact_brand_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"assignment_role" text NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "crm_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"english_name" text,
	"title" text,
	"department" text,
	"tel" text,
	"mobile" text,
	"email" text,
	"status" text DEFAULT 'active' NOT NULL,
	"level" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"brand_id" uuid,
	"contact_id" uuid[],
	"quotation_id" uuid,
	"interaction_type" text NOT NULL,
	"note" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crm_accounts" ADD CONSTRAINT "crm_accounts_group_id_crm_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."crm_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_agency_brand_assignments" ADD CONSTRAINT "crm_agency_brand_assignments_agency_account_id_crm_accounts_id_fk" FOREIGN KEY ("agency_account_id") REFERENCES "public"."crm_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_agency_brand_assignments" ADD CONSTRAINT "crm_agency_brand_assignments_client_brand_id_crm_brands_id_fk" FOREIGN KEY ("client_brand_id") REFERENCES "public"."crm_brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_brands" ADD CONSTRAINT "crm_brands_account_id_crm_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."crm_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contact_brand_assignments" ADD CONSTRAINT "crm_contact_brand_assignments_contact_id_crm_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contact_brand_assignments" ADD CONSTRAINT "crm_contact_brand_assignments_brand_id_crm_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."crm_brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_account_id_crm_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."crm_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_account_id_crm_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."crm_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_brand_id_crm_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."crm_brands"("id") ON DELETE no action ON UPDATE no action;