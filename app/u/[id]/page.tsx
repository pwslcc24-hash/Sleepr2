import { prisma } from '../../../lib/prisma'
import { getCurrentUser } from '../../../lib/auth'
import { redirect } from 'next/navigation'
import WeeklyChart from '../../../components/WeeklyChart'
import { format } from 'date-fns'

async function followAction(formData: FormData) {
  'use server'
  const viewer = await getCurrentUser()
  if (!viewer) throw new Error('Unauthorized')
  const userId = String(formData.get('userId'))
  if (userId === viewer.id) return
  const existing = await prisma.follow.findFirst({ where: { followerId: viewer.id, followingId: userId } })
  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } })
  } else {
    await prisma.follow.create({ data: { followerId: viewer.id, followingId: userId } })
  }
}

async function syncGarminAction(formData: FormData) {
  'use server'
  const viewer = await getCurrentUser()
  if (!viewer) throw new Error('Unauthorized')
  const { syncGarminSleepForUser } = await import('../../../lib/garminService')
  await syncGarminSleepForUser(viewer.id)
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const viewer = await getCurrentUser()
  if (!viewer) redirect('/login')
  const user = await prisma.user.findUnique({ where: { id: params.id }, include: { sleepSessions: { orderBy: { date: 'desc' } } } })
  if (!user) redirect('/feed')
  const following = await prisma.follow.findFirst({ where: { followerId: viewer.id, followingId: user.id } })
  const followersCount = await prisma.follow.count({ where: { followingId: user.id } })
  const followingCount = await prisma.follow.count({ where: { followerId: user.id } })
  const last7 = user.sleepSessions.filter(s => s.date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  const avgDuration7 = last7.length ? Math.round(last7.reduce((a, b) => a + b.durationMinutes, 0) / last7.length) : 0
  const last30 = user.sleepSessions.filter(s => s.date > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const avgDuration30 = last30.length ? Math.round(last30.reduce((a, b) => a + b.durationMinutes, 0) / last30.length) : 0
  const avgScore7 = last7.filter(s => s.score !== null).map(s => s.score || 0)
  const avgScore7Val = avgScore7.length ? Math.round(avgScore7.reduce((a, b) => a + b, 0) / avgScore7.length) : 0
  const avgScore30List = last30.filter(s => s.score !== null).map(s => s.score || 0)
  const avgScore30Val = avgScore30List.length ? Math.round(avgScore30List.reduce((a, b) => a + b, 0) / avgScore30List.length) : 0
  const qualityBuckets = ['Excellent', 'Good', 'Fair', 'Poor'].map(q => ({ q, count: user.sleepSessions.filter(s => s.quality === q).length }))
  const chartData = Array.from({ length: 7 }).map((_, idx) => {
    const date = new Date(Date.now() - (6 - idx) * 24 * 60 * 60 * 1000)
    const key = format(date, 'MMM d')
    const sessions = user.sleepSessions.filter(s => format(s.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
    const total = sessions.reduce((a, b) => a + b.durationMinutes, 0)
    return { day: key, value: total ? Math.round(total / 60) : 0 }
  })
  return (
    <div className="space-y-4">
      <div className="card flex flex-col md:flex-row justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold">{user.name || user.email}</h1>
          <p className="text-gray-600">{user.bio || 'Sleeping enthusiast'}</p>
          <div className="text-sm text-gray-700">Followers: {followersCount} • Following: {followingCount}</div>
        </div>
        {viewer.id !== user.id && (
          <form action={followAction}>
            <input type="hidden" name="userId" value={user.id} />
            <button className="btn">{following ? 'Unfollow' : 'Follow'}</button>
          </form>
        )}
        {viewer.id === user.id && (
          <form action={syncGarminAction}>
            <button className="btn" type="submit">Sync Garmin Sleep</button>
          </form>
        )}
      </div>
      <div className="card">
        <h2 className="font-semibold mb-2">Last 7 days duration (hours)</h2>
        <WeeklyChart data={chartData} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Averages</h3>
          <p>Avg duration 7d: {avgDuration7} min</p>
          <p>Avg duration 30d: {avgDuration30} min</p>
          <p>Avg score 7d: {avgScore7Val}</p>
          <p>Avg score 30d: {avgScore30Val}</p>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Quality distribution</h3>
          <ul className="space-y-1">
            {qualityBuckets.map(q => (
              <li key={q.q}>{q.q}: {q.count}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-3">Recent sleep</h3>
        <div className="space-y-2">
          {user.sleepSessions.slice(0, 10).map(s => (
            <div key={s.id} className="border rounded px-3 py-2 flex justify-between">
              <div>
                <p className="font-semibold">{s.title || format(s.date, 'PPP')}</p>
                <p className="text-sm text-gray-600">{format(s.date, 'PPP')}</p>
              </div>
              <div className="text-sm text-gray-700">{Math.floor(s.durationMinutes/60)}h {s.durationMinutes%60}m</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
