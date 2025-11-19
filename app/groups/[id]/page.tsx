import { prisma } from '../../../lib/prisma'
import { getCurrentUser } from '../../../lib/auth'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

async function addMemberAction(formData: FormData) {
  'use server'
  const viewer = await getCurrentUser()
  if (!viewer) throw new Error('Unauthorized')
  const groupId = String(formData.get('groupId'))
  const email = String(formData.get('email'))
  const group = await prisma.group.findUnique({ where: { id: groupId } })
  if (!group || group.ownerId !== viewer.id) throw new Error('Forbidden')
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return
  const existing = await prisma.groupMember.findFirst({ where: { groupId, userId: user.id } })
  if (existing) return
  await prisma.groupMember.create({ data: { groupId, userId: user.id, role: 'member' } })
}

export default async function GroupDetail({ params }: { params: { id: string } }) {
  const viewer = await getCurrentUser()
  if (!viewer) redirect('/login')
  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      members: { include: { user: true } },
    }
  })
  if (!group) redirect('/groups')
  const memberIds = group.members.map(m => m.userId)
  const feedSessions = await prisma.sleepSession.findMany({ where: { userId: { in: memberIds } }, include: { user: true }, orderBy: { date: 'desc' }, take: 10 })
  const isOwner = group.ownerId === viewer.id
  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <p className="text-gray-700">{group.description}</p>
        <p className="text-sm text-gray-600">Owner: {group.owner.name || group.owner.email}</p>
        {isOwner && (
          <form action={addMemberAction} className="mt-2 flex space-x-2">
            <input type="hidden" name="groupId" value={group.id} />
            <input name="email" placeholder="Invite by email" className="flex-1 border rounded px-3 py-2" />
            <button className="btn" type="submit">Add</button>
          </form>
        )}
      </div>
      <div className="card">
        <h2 className="font-semibold mb-2">Members</h2>
        <ul className="space-y-1">
          {group.members.map(m => (
            <li key={m.id} className="text-sm">{m.user.name || m.user.email} ({m.role})</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h2 className="font-semibold mb-2">Recent group sleep</h2>
        <div className="space-y-2">
          {feedSessions.map(s => (
            <div key={s.id} className="border rounded px-3 py-2 flex justify-between">
              <div>
                <p className="font-semibold">{s.title || format(s.date, 'PPP')}</p>
                <p className="text-xs text-gray-500">{s.user.name || s.user.email}</p>
              </div>
              <div className="text-sm">{Math.floor(s.durationMinutes/60)}h {s.durationMinutes%60}m</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
