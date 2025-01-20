import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

import eventParticipants from './eventParticipants';
import users from './users';

const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  date: timestamp('date').notNull(),
  organizerId: uuid('organizer_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const eventsRelations = relations(events, ({ many, one }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  participants: many(eventParticipants),
}));

export default events;

export const InsertEventSchema = createInsertSchema(events, {
  date: z.coerce.date(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  organizerId: true,
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
