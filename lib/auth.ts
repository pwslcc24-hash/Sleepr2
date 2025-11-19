import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { Role } from '@prisma/client'

const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'dev-secret')

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string, role: Role) {
  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)
  cookies().set('sleepr_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7 })
}

export function clearSession() {
  cookies().delete('sleepr_session')
}

export async function getCurrentUser() {
  const cookie = cookies().get('sleepr_session')
  if (!cookie) return null
  try {
    const { payload } = await jwtVerify(cookie.value, secret)
    const user = await prisma.user.findUnique({ where: { id: String(payload.userId) } })
    if (user?.disabled) return null
    return user
  } catch (e) {
    return null
  }
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'admin') throw new Error('Forbidden')
  return user
}
