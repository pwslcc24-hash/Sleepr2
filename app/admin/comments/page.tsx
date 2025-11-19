import { prisma } from '../../../lib/prisma'
import { getCurrentUser } from '../../../lib/auth'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

async function deleteAction(formData: FormData) {
  'use server'
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'admin') throw new Error('Unauthorized')
  const id = String(formData.get('id'))
  await prisma.comment.delete({ where: { id } })
}

export default async function AdminCommentsPage() {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'admin') redirect('/feed')
  const comments = await prisma.comment.findMany({ include: { user: true, sleepSession: true }, orderBy: { createdAt: 'desc' }, take: 50 })
  return (
    <div className="card space-y-2">
      <h1 className="text-xl font-semibold">Comments</h1>
      {comments.map(c => (
        <div key={c.id} className="border rounded px-3 py-2 flex justify-between items-center">
          <div>
            <p className="font-semibold">{c.user.email}</p>
            <p className="text-sm text-gray-600">{format(c.createdAt, 'Pp')} • On {c.sleepSession.title || c.sleepSession.id}</p>
            <p>{c.text}</p>
          </div>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={c.id} />
            <button className="text-red-600">Delete</button>
          </form>
        </div>
      ))}
    </div>
  )
}
