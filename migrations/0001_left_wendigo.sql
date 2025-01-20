ALTER TABLE "events" ADD COLUMN "date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN IF EXISTS "start_date";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN IF EXISTS "end_date";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN IF EXISTS "location";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN IF EXISTS "capacity";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN IF EXISTS "status";