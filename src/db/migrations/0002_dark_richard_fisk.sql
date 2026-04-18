CREATE TABLE "crm_account_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"changed_field" text NOT NULL,
	"old_value" text,
	"new_value" text NOT NULL,
	"changed_by" text NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crm_accounts" ALTER COLUMN "agency_tier" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "crm_accounts" ALTER COLUMN "account_owner" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "crm_account_history" ADD CONSTRAINT "crm_account_history_account_id_crm_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."crm_accounts"("id") ON DELETE no action ON UPDATE no action;