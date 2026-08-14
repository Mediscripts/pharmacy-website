const technicalPatterns = [
  'api key',
  'database',
  'migration',
  'supabase',
  'relation "',
  'function ',
  'rpc ',
  'permission denied',
  'unauthorized',
  'forbidden',
  'internal server',
  'failed to fetch',
  'fetch failed',
  'networkerror',
  '503',
  '500',
  'stack trace',
]

export function getFriendlyErrorMessage(error, fallback = 'We could not complete that request right now. Please try again.') {
  const rawMessage =
    typeof error === 'string'
      ? error
      : String(error?.publicMessage || error?.message || '').trim()

  if (!rawMessage) {
    return fallback
  }

  const normalized = rawMessage.toLowerCase()

  if (technicalPatterns.some((pattern) => normalized.includes(pattern))) {
    return fallback
  }

  return rawMessage
}
