/**
 * Convenience aliases over the generated database types.
 *
 * `database.ts` is generated output and gets overwritten by
 * `supabase gen types typescript --linked` -- keep hand-written types here.
 */
import type { Database } from './database';

export type { Database, Json } from './database';

export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];

export type EventParticipant =
  Database['public']['Tables']['event_participants']['Row'];
export type EventParticipantInsert =
  Database['public']['Tables']['event_participants']['Insert'];
