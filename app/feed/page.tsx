import Link from 'next/link'
import { prisma } from '../../lib/prisma'
import { getCurrentUser } from '../../lib/auth'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

async function reactAction(formData: FormData) {
  'use server'
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  const sessionId = String(formData.get('sessionId'))
  const existing = await prisma.reaction.findFirst({ where: { userId: user.id, sleepSessionId: sessionId } })
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } })
  } else {
    await prisma.reaction.create({ data: { userId: user.id, sleepSessionId: sessionId, type: 'like' } })
  }
}

export default async function FeedPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const following = await prisma.follow.findMany({ where: { followerId: user.id }, select: { followingId: true } })
  const ids = [user.id, ...following.map(f => f.followingId)]
  const sessions = await prisma.sleepSession.findMany({
    where: { userId: { in: ids } },
    include: { user: true, reactions: true, comments: true },
    orderBy: { date: 'desc' },
    take: 20
  })
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Your feed</h1>
      {sessions.map(session => {
        const reacted = session.reactions.some(r => r.userId === user.id)
        const durationHours = Math.floor(session.durationMinutes / 60)
        const durationMinutes = session.durationMinutes % 60
        return (
          <div key={session.id} className="card space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{session.user.name || session.user.email}</p>
                <p className="text-sm text-gray-500">{format(new Date(session.date), 'PPP')}</p>
              </div>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded">{session.source}</span>
            </div>
            <Link href={`/sleep/${session.id}`} className="text-lg font-semibold text-indigo-700">
              {session.title || `Sleep on ${format(new Date(session.date), 'PPP')}`}
            </Link>
            <p className="text-sm text-gray-700">{session.description}</p>
            <div className="text-sm text-gray-700 flex space-x-4">
              <span>Duration: {durationHours}h {durationMinutes}m</span>
              {session.score !== null && <span>Score: {session.score}</span>}
              {session.restingHeartRate !== null && <span>RHR: {session.restingHeartRate}</span>}
              {session.quality && <span>Quality: {session.quality}</span>}
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <form action={reactAction}>
                <input type="hidden" name="sessionId" value={session.id} />
                <button className="text-indigo-600">{reacted ? 'Remove reaction' : 'React'}</button>
              </form>
              <span>{session.reactions.length} reactions</span>
              <span>{session.comments.length} comments</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
