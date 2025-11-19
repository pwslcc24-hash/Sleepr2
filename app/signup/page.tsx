import { prisma } from '../../lib/prisma'
import { createSession, hashPassword } from '../../lib/auth'
import { redirect } from 'next/navigation'

async function signupAction(formData: FormData) {
  'use server'
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))
  const name = String(formData.get('name') || '')
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'Email already registered' }
  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({ data: { email, passwordHash, name } })
  await createSession(user.id, user.role)
  redirect('/feed')
}

export default function SignupPage() {
  return (
    <div className="max-w-md mx-auto card">
      <h1 className="text-xl font-semibold mb-4">Create account</h1>
      <form action={signupAction} className="space-y-3">
        <input name="name" type="text" placeholder="Name" className="w-full border rounded px-3 py-2" />
        <input name="email" type="email" placeholder="Email" className="w-full border rounded px-3 py-2" required />
        <input name="password" type="password" placeholder="Password" className="w-full border rounded px-3 py-2" required />
        <button className="btn w-full" type="submit">Sign up</button>
      </form>
    </div>
  )
}
