const MAX_EDGE = 2560
const LARGE_FILE_BYTES = 8 * 1024 * 1024
// camera photos carry EXIF data such as GPS location; re-encoding drops it
const ALWAYS_REENCODE = new Set(['image/jpeg', 'image/heic', 'image/heif'])

export async function prepareImage(file: File): Promise<File> {
  if (file.type === 'image/gif') return file
  if (!ALWAYS_REENCODE.has(file.type) && file.size < LARGE_FILE_BYTES) return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    // this browser can't decode the format (e.g. HEIC outside Safari): upload the original
    return file
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return file
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
  if (!blob) return file

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'moment'
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
}
