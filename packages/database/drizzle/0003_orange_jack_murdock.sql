CREATE TABLE "performance_records_after" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" varchar(255) NOT NULL,
	"lookup_key" varchar(255) NOT NULL,
	"label" varchar(255) NOT NULL,
	"category" varchar(64) NOT NULL,
	"details" text NOT NULL,
	"score" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_records_before" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" varchar(255) NOT NULL,
	"lookup_key" varchar(255) NOT NULL,
	"label" varchar(255) NOT NULL,
	"category" varchar(64) NOT NULL,
	"details" text NOT NULL,
	"score" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "performance_records_after" ADD CONSTRAINT "performance_records_after_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_records_before" ADD CONSTRAINT "performance_records_before_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "performance_records_after_owner_lookup_idx" ON "performance_records_after" USING btree ("owner_id","lookup_key");--> statement-breakpoint
CREATE INDEX "performance_records_before_owner_id_idx" ON "performance_records_before" USING btree ("owner_id");