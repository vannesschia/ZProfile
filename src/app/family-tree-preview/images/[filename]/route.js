import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
const types = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

export async function GET(_request, { params }) {
  if (process.env.NODE_ENV !== 'development') return new Response(null, { status: 404 });
  const { filename } = await params;
  if (!/^[a-f0-9]{64}\.(jpg|png|webp|gif)$/.test(filename)) return new Response(null, { status: 404 });
  try {
    const data = await readFile(path.join(process.cwd(), '.local/family-tree-preview/images', filename));
    return new Response(data, { headers: {
      'Content-Type': types[filename.split('.').pop()],
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    } });
  } catch (error) {
    if (error.code === 'ENOENT') return new Response(null, { status: 404 });
    throw error;
  }
}
