import { createClient } from '@/server/supabase/client';

export const EVENT_IMAGES_BUCKET = 'event-images';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

type UploadResult = { url?: string; error?: string };

/**
 * Uploads an event image straight from the browser to Supabase Storage.
 *
 * The file never passes through the Next.js server -- the previous Vercel Blob
 * route proxied every upload through a serverless function for no reason.
 *
 * Files land under `<user-id>/`, which is what the storage policies key on.
 * The checks here are for fast feedback; the bucket enforces them too.
 */
export const uploadEventImage = async (file: File): Promise<UploadResult> => {
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return { error: 'Nur JPEG, PNG, WebP oder AVIF sind erlaubt' };
  }

  if (file.size > MAX_BYTES) {
    return { error: 'Das Bild darf höchstens 5 MB gross sein' };
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return { error: 'Du musst angemeldet sein, um ein Bild hochzuladen' };

  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(EVENT_IMAGES_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) return { error: 'Bild konnte nicht hochgeladen werden' };

  const {
    data: { publicUrl },
  } = supabase.storage.from(EVENT_IMAGES_BUCKET).getPublicUrl(path);

  return { url: publicUrl };
};
