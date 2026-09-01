CREATE TABLE "realtime_chat_messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"room_id" varchar(48) NOT NULL,
	"sender_id" text NOT NULL,
	"sender_name" varchar(80) NOT NULL,
	"content" varchar(500) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "realtime_notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"recipient_id" text NOT NULL,
	"type" varchar(32) NOT NULL,
	"title" varchar(120) NOT NULL,
	"message" varchar(500) NOT NULL,
	"metadata" jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "realtime_chat_messages" ADD CONSTRAINT "realtime_chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "realtime_notifications" ADD CONSTRAINT "realtime_notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "realtime_chat_messages_room_id_created_at_idx" ON "realtime_chat_messages" USING btree ("room_id","created_at");--> statement-breakpoint
CREATE INDEX "realtime_notifications_recipient_id_created_at_idx" ON "realtime_notifications" USING btree ("recipient_id","created_at");--> statement-breakpoint
CREATE INDEX "realtime_notifications_recipient_id_read_at_idx" ON "realtime_notifications" USING btree ("recipient_id","read_at");