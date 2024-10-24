import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),

  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export default sessions;
