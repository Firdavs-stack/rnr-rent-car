import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { httpError } from './validation.js';
export const UPLOAD_DIRECTORY = fileURLToPath(new URL('../../uploads/', import.meta.url));
const pattern = /^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/;
export function uploadPath(url) {
  if (typeof url !== 'string' || !pattern.test(url)) throw httpError(400, 'Сначала загрузите фотографию в систему');
  return path.join(UPLOAD_DIRECTORY, path.basename(url));
}
export async function requireUpload(url) { const file = uploadPath(url); try { const stat = await fs.stat(file); if (!stat.isFile()) throw new Error(); } catch { throw httpError(400, 'Загруженная фотография не найдена'); } return file; }
export async function normalizeImage(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw httpError(400, 'Изображение пустое');
  try {
    const image = sharp(buffer, { limitInputPixels: 32000000, failOn: 'warning' });
    const metadata = await image.metadata();
    if (!['jpeg','png','webp'].includes(metadata.format) || metadata.pages > 1) throw new Error('format');
    return await image.rotate().resize({ width: 1920, height: 1440, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  } catch { throw httpError(400, 'Файл должен быть корректным JPEG, PNG или WebP до 32 мегапикселей'); }
}
