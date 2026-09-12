// ImageKit can resize on the fly, so thumbnails don't download the full photo
export function imageUrl(url: string, width: number): string {
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.endsWith('imagekit.io')) return url
    parsed.searchParams.set('tr', `w-${width},q-80`)
    return parsed.toString()
  } catch {
    return url
  }
}
