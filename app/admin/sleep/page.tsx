import { prisma } from '../../../lib/prisma'
import { getCurrentUser } from '../../../lib/auth'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

async function deleteAction(formData: FormData) {
  'use server'
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'admin') throw new Error('Unauthorized')
  const id = String(formData.get('id'))
  await prisma.sleepSession.delete({ where: { id } })
}

export default async function AdminSleepPage() {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'admin') redirect('/feed')
  const sessions = await prisma.sleepSession.findMany({ include: { user: true }, orderBy: { date: 'desc' }, take: 50 })
  return (
    <div className="card space-y-2">
      <h1 className="text-xl font-semibold">All Sleep Sessions</h1>
      {sessions.map(s => (
        <div key={s.id} className="border rounded px-3 py-2 flex justify-between items-center">
          <div>
            <p className="font-semibold">{s.user.email} — {format(s.date, 'PPP')}</p>
            <p className="text-sm text-gray-600">Duration {Math.floor(s.durationMinutes/60)}h {s.durationMinutes%60}m • Source {s.source}</p>
          </div>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={s.id} />
            <button className="text-red-600">Delete</button>
          </form>
        </div>
      ))}
    </div>
  )
}
