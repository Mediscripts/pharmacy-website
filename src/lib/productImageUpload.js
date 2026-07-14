import { supabase } from './supabaseClient'

const bucketName = import.meta.env.VITE_SUPABASE_PRODUCT_IMAGE_BUCKET || 'product-images'

function sanitizeFileName(name) {
  return String(name || 'image')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

async function loadImage(file) {
  const objectUrl = URL.createObjectURL(file)

  try {
    return await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Unable to read image file.'))
      image.src = objectUrl
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function compressImageFile(file, options = {}) {
  const maxWidth = options.maxWidth || 1600
  const maxHeight = options.maxHeight || 1600
  const quality = options.quality || 0.82

  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files can be uploaded.')
  }

  const image = await loadImage(file)
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1)
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Your browser cannot process image compression.')
  }

  context.drawImage(image, 0, 0, width, height)

  const blob = await new Promise((resolve) => {
    canvas.toBlob((result) => resolve(result), 'image/webp', quality)
  })

  if (!blob) {
    return file
  }

  const baseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ''))
  const compressedName = `${baseName || 'image'}.webp`

  return new File([blob], compressedName, { type: 'image/webp' })
}

export async function uploadProductImages(files) {
  const imageFiles = Array.from(files || [])

  if (imageFiles.length === 0) {
    return []
  }

  const uploadedUrls = []

  for (const file of imageFiles) {
    const compressedFile = await compressImageFile(file)
    const fileId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const filePath = `products/${fileId}-${sanitizeFileName(compressedFile.name)}`

    const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, compressedFile, {
      contentType: compressedFile.type || 'image/webp',
      upsert: false,
    })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath)
    uploadedUrls.push(data.publicUrl)
  }

  return uploadedUrls
}
