import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

import events from './events';

const eventParticipants = pgTable('event_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, confirmed, declined, waitlisted
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
});

export const eventParticipantsRelations = relations(
  eventParticipants,
  ({ one }) => ({
    event: one(events, {
      fields: [eventParticipants.eventId],
      references: [events.id],
    }),
  })
);

export default eventParticipants;

export const InsertEventParticipantSchema = createInsertSchema(
  eventParticipants,
  {
    name: z.string().optional(),
    eventId: z.string().uuid('Invalid event ID'),
  }
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
});

export type EventParticipant = typeof eventParticipants.$inferSelect;
export type InsertEventParticipant = typeof eventParticipants.$inferInsert;
