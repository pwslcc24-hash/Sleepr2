import { prisma } from '../../../lib/prisma'
import { getCurrentUser } from '../../../lib/auth'
import { redirect } from 'next/navigation'

async function roleAction(formData: FormData) {
  'use server'
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'admin') throw new Error('Unauthorized')
  const userId = String(formData.get('userId'))
  const role = String(formData.get('role')) as any
  await prisma.user.update({ where: { id: userId }, data: { role } })
}

export default async function AdminUsersPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') redirect('/feed')
  const users = await prisma.user.findMany({ include: { sleepSessions: true } })
  return (
    <div className="card">
      <h1 className="text-xl font-semibold mb-3">Users</h1>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="border rounded px-3 py-2 flex justify-between items-center">
            <div>
              <p className="font-semibold">{u.email}</p>
              <p className="text-sm text-gray-600">Role: {u.role} • Sessions: {u.sleepSessions.length}</p>
            </div>
            <div className="flex items-center space-x-2">
              <a className="text-indigo-600" href={`/admin/users/${u.id}`}>View</a>
              <form action={roleAction} className="flex space-x-1">
                <input type="hidden" name="userId" value={u.id} />
                <select name="role" defaultValue={u.role} className="border rounded px-2 py-1 text-sm">
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <button className="text-sm text-indigo-600" type="submit">Update</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
