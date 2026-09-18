CREATE TABLE "checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"local_date" text NOT NULL,
	"done_at" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text,
	CONSTRAINT "checkins_item_id_local_date" UNIQUE("item_id","local_date")
);
--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;