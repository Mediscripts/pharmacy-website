import { supabase } from './supabaseClient'
import { compressImageFile } from './productImageUpload'

const bucketName = 'health-article-images'

function safeName(value) {
  return String(value || 'image').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'image'
}

export async function uploadHealthArticleImage(file, folder = 'inline') {
  if (!file?.type?.startsWith('image/')) throw new Error('Choose an image file.')
  const compressed = await compressImageFile(file)
  const imageId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const path = `${folder}/${imageId}-${safeName(compressed.name)}`
  const { error } = await supabase.storage.from(bucketName).upload(path, compressed, {
    contentType: compressed.type || 'image/webp',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(bucketName).getPublicUrl(path)
  return data.publicUrl
}
