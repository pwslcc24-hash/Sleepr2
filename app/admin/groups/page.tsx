import { prisma } from '../../../lib/prisma'
import { getCurrentUser } from '../../../lib/auth'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export default async function AdminGroupsPage() {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'admin') redirect('/feed')
  const groups = await prisma.group.findMany({ include: { owner: true, members: { include: { user: true } } } })
  return (
    <div className="card space-y-2">
      <h1 className="text-xl font-semibold">Groups</h1>
      {groups.map(g => (
        <div key={g.id} className="border rounded px-3 py-2">
          <p className="font-semibold">{g.name}</p>
          <p className="text-sm text-gray-600">Owner: {g.owner.email} • Members: {g.members.length} • Created {format(g.createdAt,'PPP')}</p>
          <ul className="text-sm text-gray-700 list-disc list-inside">
            {g.members.map(m => (
              <li key={m.id}>{m.user.email} ({m.role})</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
