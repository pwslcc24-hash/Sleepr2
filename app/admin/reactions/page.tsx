import { prisma } from '../../../lib/prisma'
import { getCurrentUser } from '../../../lib/auth'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export default async function AdminReactionsPage() {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'admin') redirect('/feed')
  const reactions = await prisma.reaction.findMany({ include: { user: true, sleepSession: true }, orderBy: { createdAt: 'desc' }, take: 50 })
  return (
    <div className="card space-y-2">
      <h1 className="text-xl font-semibold">Reactions</h1>
      {reactions.map(r => (
        <div key={r.id} className="border rounded px-3 py-2">
          <p className="font-semibold">{r.user.email}</p>
          <p className="text-sm text-gray-600">{r.type} • {format(r.createdAt, 'Pp')} on {r.sleepSession.title || r.sleepSession.id}</p>
        </div>
      ))}
    </div>
  )
}
