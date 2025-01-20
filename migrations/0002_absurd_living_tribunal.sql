ALTER TABLE "event_participants" DROP CONSTRAINT "event_participants_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "event_participants" ADD COLUMN "email" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "event_participants" ADD COLUMN "name" varchar(255);--> statement-breakpoint
ALTER TABLE "event_participants" DROP COLUMN "user_id";