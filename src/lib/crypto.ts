import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.APP_ENCRYPTION_KEY
  if (!key) {
    throw new Error('APP_ENCRYPTION_KEY not set in environment')
  }
  
  // Key deve ser 32 bytes (64 caracteres hex)
  const keyBuffer = Buffer.from(key, 'hex')
  if (keyBuffer.length !== 32) {
    throw new Error('APP_ENCRYPTION_KEY must be 32 bytes (64 hex characters)')
  }
  
  return keyBuffer
}

export function encrypt(text: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  // Formato: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey()
  const parts = encryptedText.split(':')
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format')
  }
  
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]
  
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// Helper para gerar uma nova chave (usar apenas uma vez para criar APP_ENCRYPTION_KEY)
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex')
}
