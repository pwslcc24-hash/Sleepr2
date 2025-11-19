import { prisma } from '../../lib/prisma'
import { getCurrentUser } from '../../lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminHome() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') redirect('/feed')
  const [userCount, sleepCount, commentCount, reactionCount, groupCount, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.sleepSession.count(),
    prisma.comment.count(),
    prisma.reaction.count(),
    prisma.group.count(),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
  ])
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="card">Users: {userCount}</div>
      <div className="card">Sleep sessions: {sleepCount}</div>
      <div className="card">Comments: {commentCount}</div>
      <div className="card">Reactions: {reactionCount}</div>
      <div className="card">Groups: {groupCount}</div>
      <div className="card md:col-span-3">
        <h3 className="font-semibold mb-2">Recent signups</h3>
        <ul className="space-y-1">
          {recentUsers.map(u => (
            <li key={u.id}>{u.email} - {u.createdAt.toDateString()}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
