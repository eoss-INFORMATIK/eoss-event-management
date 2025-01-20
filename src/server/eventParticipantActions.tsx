'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import db from '@/db';
import eventParticipants, {
  InsertEventParticipantSchema,
} from '@/db/schema/eventParticipants';

type ActionResponse = {
  success?: boolean;
  error?: string;
};

export async function addEventParticipantAction(
  formData: z.infer<typeof InsertEventParticipantSchema>,
  eventId: string
): Promise<ActionResponse> {
  console.log('Action started with:', { formData, eventId }); // Debug incoming data

  try {
    const validatedFields = InsertEventParticipantSchema.parse({
      ...formData,
      eventId,
    });
    console.log('Validated fields:', validatedFields); // Debug validation

    const dataToInsert = {
      ...validatedFields,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    console.log('Attempting to insert:', dataToInsert); // Debug insert data

    const result = await db.insert(eventParticipants).values(dataToInsert);
    console.log('Insert result:', result); // Debug result

    revalidatePath('/events');
    return { success: true };
  } catch (error) {
    console.error('Detailed error:', {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });

    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: 'Failed to register for event' };
  }
}
