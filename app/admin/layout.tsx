import { ReactNode } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') redirect('/feed')
  return (
    <div className="space-y-4">
      <div className="card flex space-x-4">
        <a href="/admin" className="text-indigo-600">Dashboard</a>
        <a href="/admin/users" className="text-indigo-600">Users</a>
        <a href="/admin/sleep" className="text-indigo-600">Sleep</a>
        <a href="/admin/comments" className="text-indigo-600">Comments</a>
        <a href="/admin/reactions" className="text-indigo-600">Reactions</a>
        <a href="/admin/groups" className="text-indigo-600">Groups</a>
        <a href="/admin/imports" className="text-indigo-600">Imports</a>
      </div>
      {children}
    </div>
  )
}
