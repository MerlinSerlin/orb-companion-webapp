const SECRET_KEY = process.env.APP_PASSWORD || 'orb-companion-2024'

// Create HMAC signature using Web Crypto API (Edge Runtime compatible)
async function createSignature(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(message)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Create a signed session token that includes expiration
export const createSessionToken = async (): Promise<string> => {
  const now = Date.now()
  const expiresAt = now + (60 * 60 * 24 * 30 * 1000) // 30 days
  const payload = `${now}:${expiresAt}`
  
  // Create HMAC signature
  const signature = await createSignature(payload, SECRET_KEY)
  
  return `${payload}:${signature}`
}

export const isValidSession = async (token: string): Promise<boolean> => {
  if (!token) return false
  
  try {
    const parts = token.split(':')
    if (parts.length !== 3) return false
    
    const [createdAt, expiresAt, signature] = parts
    const payload = `${createdAt}:${expiresAt}`
    
    // Verify signature
    const expectedSignature = await createSignature(payload, SECRET_KEY)
    
    if (signature !== expectedSignature) return false
    
    // Check expiration
    const now = Date.now()
    if (now > parseInt(expiresAt)) return false
    
    return true
  } catch {
    return false
  }
}