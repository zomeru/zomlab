CREATE TABLE "payment_idempotency_keys" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"key" varchar(255) NOT NULL,
	"operation" varchar(100) NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"state" varchar(32) NOT NULL,
	"response_status" integer,
	"response_body" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" varchar(32) NOT NULL,
	"provider_reference_id" varchar(255),
	"provider_payment_id" varchar(255),
	"amount" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"status" varchar(32) NOT NULL,
	"description" varchar(255) NOT NULL,
	"metadata" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_webhook_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text,
	"provider" varchar(32) NOT NULL,
	"provider_event_id" varchar(255) NOT NULL,
	"event_type" varchar(255) NOT NULL,
	"status" varchar(32) NOT NULL,
	"payload" jsonb NOT NULL,
	"signature_headers" jsonb NOT NULL,
	"result" jsonb,
	"duplicate_count" integer DEFAULT 0 NOT NULL,
	"error" varchar(500),
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "payment_idempotency_keys" ADD CONSTRAINT "payment_idempotency_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_webhook_events" ADD CONSTRAINT "payment_webhook_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_idempotency_keys_scope_unique" ON "payment_idempotency_keys" USING btree ("user_id","operation","key");--> statement-breakpoint
CREATE INDEX "payment_idempotency_keys_user_id_created_at_idx" ON "payment_idempotency_keys" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_idempotency_keys_expires_at_idx" ON "payment_idempotency_keys" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "payment_transactions_user_id_created_at_idx" ON "payment_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_transactions_provider_status_idx" ON "payment_transactions" USING btree ("provider","status");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_transactions_provider_reference_unique" ON "payment_transactions" USING btree ("provider","provider_reference_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_transactions_provider_payment_unique" ON "payment_transactions" USING btree ("provider","provider_payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_webhook_events_provider_event_unique" ON "payment_webhook_events" USING btree ("provider","provider_event_id");--> statement-breakpoint
CREATE INDEX "payment_webhook_events_user_id_received_at_idx" ON "payment_webhook_events" USING btree ("user_id","received_at");--> statement-breakpoint
CREATE INDEX "payment_webhook_events_provider_status_idx" ON "payment_webhook_events" USING btree ("provider","status");