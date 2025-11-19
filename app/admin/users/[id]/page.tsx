import { prisma } from '../../../../lib/prisma'
import { getCurrentUser } from '../../../../lib/auth'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

async function roleAction(formData: FormData) {
  'use server'
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'admin') throw new Error('Unauthorized')
  const userId = String(formData.get('userId'))
  const role = String(formData.get('role')) as any
  await prisma.user.update({ where: { id: userId }, data: { role } })
}

export default async function AdminUserDetail({ params }: { params: { id: string } }) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'admin') redirect('/feed')
  const user = await prisma.user.findUnique({ where: { id: params.id }, include: { sleepSessions: true, comments: { take: 5, orderBy: { createdAt: 'desc' } }, reactions: { take: 5, orderBy: { createdAt: 'desc' } } } })
  if (!user) redirect('/admin/users')
  const avgDuration = user.sleepSessions.length ? Math.round(user.sleepSessions.reduce((a,b)=>a+b.durationMinutes,0)/user.sleepSessions.length) : 0
  const avgScoreList = user.sleepSessions.filter(s => s.score !== null).map(s => s.score || 0)
  const avgScore = avgScoreList.length ? Math.round(avgScoreList.reduce((a,b)=>a+b,0)/avgScoreList.length) : 0
  const qualityDist = ['Excellent','Good','Fair','Poor'].map(q => ({ q, count: user.sleepSessions.filter(s => s.quality === q).length }))
  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-2xl font-bold">{user.email}</h1>
        <p className="text-sm text-gray-600">Role: {user.role} • Created {format(user.createdAt, 'PPP')}</p>
        <p className="text-sm">Last login: {user.lastLoginAt ? format(user.lastLoginAt, 'PPP') : 'n/a'}</p>
        <form action={roleAction} className="mt-2 flex space-x-2 items-center">
          <input type="hidden" name="userId" value={user.id} />
          <select name="role" defaultValue={user.role} className="border rounded px-2 py-1 text-sm">
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <button className="btn" type="submit">Update role</button>
        </form>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">Total sessions: {user.sleepSessions.length}</div>
        <div className="card">Avg duration: {avgDuration} min</div>
        <div className="card">Avg score: {avgScore}</div>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Quality distribution</h3>
        <ul>
          {qualityDist.map(q => <li key={q.q}>{q.q}: {q.count}</li>)}
        </ul>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Recent sleep</h3>
        <ul className="space-y-1">
          {user.sleepSessions.slice(0,5).map(s => (
            <li key={s.id}>{format(s.date,'PPP')} — {Math.floor(s.durationMinutes/60)}h {s.durationMinutes%60}m</li>
          ))}
        </ul>
      </div>
      <div className="card grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <h4 className="font-semibold">Recent comments</h4>
          <ul className="space-y-1">
            {user.comments.map(c => <li key={c.id}>{format(c.createdAt,'Pp')}: {c.text}</li>)}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Recent reactions</h4>
          <ul className="space-y-1">
            {user.reactions.map(r => <li key={r.id}>{format(r.createdAt,'Pp')} – {r.type}</li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}
