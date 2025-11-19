import { notFound, redirect } from 'next/navigation'
import { prisma } from '../../../lib/prisma'
import { getCurrentUser } from '../../../lib/auth'
import Link from 'next/link'
import { format } from 'date-fns'

async function commentAction(formData: FormData) {
  'use server'
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  const sleepSessionId = String(formData.get('sleepSessionId'))
  const text = String(formData.get('text') || '')
  await prisma.comment.create({ data: { userId: user.id, sleepSessionId, text } })
}

async function reactionAction(formData: FormData) {
  'use server'
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  const sleepSessionId = String(formData.get('sleepSessionId'))
  const existing = await prisma.reaction.findFirst({ where: { userId: user.id, sleepSessionId } })
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } })
  } else {
    await prisma.reaction.create({ data: { userId: user.id, sleepSessionId, type: 'like' } })
  }
}

async function deleteAction(formData: FormData) {
  'use server'
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  const sleepSessionId = String(formData.get('sleepSessionId'))
  const session = await prisma.sleepSession.findUnique({ where: { id: sleepSessionId } })
  if (!session) return
  if (session.userId !== user.id && user.role !== 'admin') throw new Error('Forbidden')
  await prisma.sleepSession.delete({ where: { id: sleepSessionId } })
  redirect('/feed')
}

export default async function SleepDetail({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const session = await prisma.sleepSession.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      comments: { include: { user: true }, orderBy: { createdAt: 'desc' } },
      reactions: { include: { user: true } },
    }
  })
  if (!session) notFound()
  const reacted = session.reactions.some(r => r.userId === user.id)
  const durationHours = Math.floor(session.durationMinutes / 60)
  const durationMinutes = session.durationMinutes % 60
  return (
    <div className="space-y-4">
      <div className="card space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold">{session.user.name || session.user.email}</p>
            <p className="text-sm text-gray-600">{format(new Date(session.date), 'PPP')}</p>
          </div>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{session.source}</span>
        </div>
        <h1 className="text-2xl font-bold">{session.title || 'Sleep session'}</h1>
        <p>{session.description}</p>
        <div className="text-sm space-y-1">
          <div>Duration: {durationHours}h {durationMinutes}m</div>
          {session.score !== null && <div>Score: {session.score}</div>}
          {session.restingHeartRate !== null && <div>Resting HR: {session.restingHeartRate}</div>}
          {session.quality && <div>Quality: {session.quality}</div>}
          {session.bedtime && <div>Bedtime: {format(new Date(session.bedtime), 'Pp')}</div>}
          {session.wakeTime && <div>Wake time: {format(new Date(session.wakeTime), 'Pp')}</div>}
        </div>
        <div className="flex items-center space-x-3 text-sm">
          <form action={reactionAction}>
            <input type="hidden" name="sleepSessionId" value={session.id} />
            <button className="text-indigo-600">{reacted ? 'Remove reaction' : 'React'}</button>
          </form>
          <span>{session.reactions.length} reactions</span>
          <span>{session.comments.length} comments</span>
          {(session.userId === user.id || user.role === 'admin') && (
            <form action={deleteAction}>
              <input type="hidden" name="sleepSessionId" value={session.id} />
              <button className="text-red-600">Delete</button>
            </form>
          )}
        </div>
      </div>
      <div className="card">
        <h2 className="font-semibold mb-2">Comments</h2>
        <form action={commentAction} className="flex space-x-2 mb-3">
          <input type="hidden" name="sleepSessionId" value={session.id} />
          <input name="text" placeholder="Leave a comment" className="flex-1 border rounded px-3 py-2" required />
          <button className="btn" type="submit">Post</button>
        </form>
        <div className="space-y-2">
          {session.comments.map(c => (
            <div key={c.id} className="border rounded px-3 py-2">
              <p className="text-sm font-semibold">{c.user.name || c.user.email}</p>
              <p className="text-xs text-gray-500">{format(new Date(c.createdAt), 'Pp')}</p>
              <p>{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
