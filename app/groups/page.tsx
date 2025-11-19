import { prisma } from '../../lib/prisma'
import { getCurrentUser } from '../../lib/auth'
import { redirect } from 'next/navigation'

async function createGroupAction(formData: FormData) {
  'use server'
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  const name = String(formData.get('name'))
  const description = String(formData.get('description') || '')
  const group = await prisma.group.create({ data: { name, description, ownerId: user.id } })
  await prisma.groupMember.create({ data: { groupId: group.id, userId: user.id, role: 'owner' } })
}

export default async function GroupsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const groups = await prisma.group.findMany({ include: { members: true, owner: true } })
  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-xl font-semibold mb-3">Create Group</h1>
        <form action={createGroupAction} className="space-y-2">
          <input name="name" placeholder="Group name" className="w-full border rounded px-3 py-2" required />
          <textarea name="description" placeholder="Description" className="w-full border rounded px-3 py-2" />
          <button className="btn" type="submit">Create</button>
        </form>
      </div>
      <div className="space-y-3">
        {groups.map(g => (
          <div key={g.id} className="card flex justify-between">
            <div>
              <p className="font-semibold">{g.name}</p>
              <p className="text-sm text-gray-600">Owner: {g.owner.name || g.owner.email}</p>
              <p className="text-sm text-gray-600">Members: {g.members.length}</p>
            </div>
            <a className="text-indigo-600" href={`/groups/${g.id}`}>View</a>
          </div>
        ))}
      </div>
    </div>
  )
}
