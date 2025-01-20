import { relations } from 'drizzle-orm';
import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import eventParticipants from './eventParticipants';
import users from './users';

const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  location: varchar('location', { length: 255 }),
  organizerId: uuid('organizer_id')
    .notNull()
    .references(() => users.id),
  capacity: integer('capacity'),
  status: varchar('status', { length: 20 }).default('draft').notNull(), // draft, published, cancelled
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

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
