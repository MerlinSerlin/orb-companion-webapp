// Simple in-memory session store (resets on server restart)
export const sessions = new Map<string, { createdAt: number; expiresAt: number }>()

// Clean up expired sessions periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [token, session] of sessions.entries()) {
      if (now > session.expiresAt) {
        sessions.delete(token)
      }
    }
  }, 60 * 60 * 1000) // Clean up every hour
}

export const isValidSession = (token: string): boolean => {
  const session = sessions.get(token)
  if (!session) return false
  
  const now = Date.now()
  if (now > session.expiresAt) {
    sessions.delete(token)
    return false
  }
  
  return true
}