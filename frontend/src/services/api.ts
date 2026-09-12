const TOKEN_KEY = 'moments.token'

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // storage unavailable (private mode): the session lasts until reload
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // nothing stored
    }
  },
}

export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(status: number, detail: unknown, message: string) {
    super(message)
    this.status = status
    this.detail = detail
  }
}

const SERVER_UNREACHABLE = "Can't reach the server. Check that the backend is running, then try again."

const DETAIL_MESSAGES: Record<string, string> = {
  LOGIN_BAD_CREDENTIALS: 'Wrong email, username or password.',
  REGISTER_USER_ALREADY_EXISTS: 'An account with this email already exists. Sign in instead.',
  USERNAME_ALREADY_EXISTS: 'That username is taken. Try another one.',
  'Post not found': 'This moment no longer exists.',
  'You are not authorized to delete this post': 'You can only delete your own moments.',
}

const FIELD_MESSAGES: Record<string, string> = {
  email: 'Enter a valid email address.',
  username: 'Usernames are 3–20 characters: letters, numbers and underscores.',
  password: 'Enter a password.',
  caption: 'Your thought is too long.',
  file: 'Choose a photo to upload.',
}

function describeError(status: number, detail: unknown): string {
  if (typeof detail === 'string') {
    if (detail.startsWith('Image upload failed')) {
      return "Your photo couldn't be uploaded. Check your connection and try again."
    }
    return DETAIL_MESSAGES[detail] ?? detail
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { loc?: unknown[]; msg?: string }
    const field = String(first.loc?.at(-1) ?? '')
    return FIELD_MESSAGES[field] ?? first.msg ?? 'Check the form and try again.'
  }
  if (detail && typeof detail === 'object' && 'reason' in detail) {
    return String((detail as { reason: unknown }).reason)
  }
  if (status >= 500) {
    return 'Something went wrong on the server. Try again.'
  }
  return 'Something went wrong. Try again.'
}

let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

interface RequestOptions {
  method?: string
  json?: unknown
  body?: URLSearchParams | FormData
  auth?: boolean
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', json, body, auth = true } = options
  const headers: Record<string, string> = {}
  let payload: BodyInit | undefined = body

  if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(json)
  }

  const token = auth ? tokenStore.get() : null
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`/api${path}`, { method, headers, body: payload })
  } catch {
    throw new ApiError(0, null, SERVER_UNREACHABLE)
  }

  const text = await response.text()
  let data: { detail?: unknown } | null = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      unauthorizedHandler?.()
    }
    // the dev proxy answers with an empty 5xx when the backend is down
    if (response.status >= 500 && data === null) {
      throw new ApiError(response.status, null, SERVER_UNREACHABLE)
    }
    throw new ApiError(response.status, data?.detail ?? null, describeError(response.status, data?.detail))
  }

  return data as T
}
