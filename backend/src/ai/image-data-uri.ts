import { Logger } from '@nestjs/common';
import sharp from 'sharp';
import { StorageService } from '../storage/storage.service';

const logger = new Logger('ImageDataUri');

// Fetch a stored image and downscale it into a small base64 data URI. Image / VL
// providers cap the request body (~6 MB) and reach our MinIO only via inline data
// (dev URLs aren't publicly reachable), so we shrink to <=1024px JPEG and inline it.
// Any failure → null (callers fall back gracefully).
export async function toDataUri(
  storage: StorageService,
  imageKey: string | null,
): Promise<string | null> {
  if (!imageKey) return null;
  try {
    const url = await storage.toUrl(imageKey);
    if (!url) return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    const input = Buffer.from(await res.arrayBuffer());
    const out = await sharp(input)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    return `data:image/jpeg;base64,${out.toString('base64')}`;
  } catch (err) {
    logger.warn(`Data URI prep failed for ${imageKey}: ${String(err)}`);
    return null;
  }
}
