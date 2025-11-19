import { prisma } from '../../lib/prisma'
import { createSession, verifyPassword } from '../../lib/auth'
import { redirect } from 'next/navigation'

async function loginAction(formData: FormData) {
  'use server'
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return { error: 'Invalid credentials' }
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) return { error: 'Invalid credentials' }
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  await createSession(user.id, user.role)
  redirect('/feed')
}

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="max-w-md mx-auto card">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <form action={loginAction} className="space-y-3">
        <input name="email" type="email" placeholder="Email" className="w-full border rounded px-3 py-2" required />
        <input name="password" type="password" placeholder="Password" className="w-full border rounded px-3 py-2" required />
        <button className="btn w-full" type="submit">Login</button>
      </form>
      {searchParams?.error && <p className="text-red-600 mt-2">{searchParams.error}</p>}
    </div>
  )
}
