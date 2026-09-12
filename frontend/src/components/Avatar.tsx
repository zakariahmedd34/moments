const GRADIENTS: [string, string][] = [
  ['#FFB25B', '#E0662F'],
  ['#9AD1D4', '#3F6573'],
  ['#D9B99B', '#6A5140'],
  ['#B7A6E8', '#5B4A9A'],
  ['#F5A3B7', '#B24A6B'],
  ['#A8D89A', '#4E7A3A'],
  ['#FFD66B', '#C98A1B'],
  ['#9BB8F0', '#3E5B9A'],
]

function hashString(value: string): number {
  let hash = 0
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0
  }
  return Math.abs(hash)
}

interface AvatarProps {
  username: string
  size?: number
}

export function Avatar({ username, size = 32 }: AvatarProps) {
  const [from, to] = GRADIENTS[hashString(username) % GRADIENTS.length]
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.44),
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {username.charAt(0).toUpperCase()}
    </span>
  )
}
