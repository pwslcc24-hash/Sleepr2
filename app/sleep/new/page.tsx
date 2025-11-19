import { redirect } from 'next/navigation'
import { prisma } from '../../../lib/prisma'
import { getCurrentUser } from '../../../lib/auth'

async function createSleepAction(formData: FormData) {
  'use server'
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  const date = new Date(String(formData.get('date')))
  const title = String(formData.get('title') || '')
  const description = String(formData.get('description') || '')
  const score = formData.get('score') ? Number(formData.get('score')) : null
  const restingHeartRate = formData.get('restingHeartRate') ? Number(formData.get('restingHeartRate')) : null
  const quality = formData.get('quality') ? String(formData.get('quality')) as any : null
  const durationMinutes = Number(formData.get('durationMinutes') || 0)
  const bedtimeValue = formData.get('bedtime') ? new Date(String(formData.get('bedtime'))) : null
  const wakeTimeValue = formData.get('wakeTime') ? new Date(String(formData.get('wakeTime'))) : null
  await prisma.sleepSession.create({
    data: {
      userId: user.id,
      date,
      title: title || null,
      description: description || null,
      score,
      restingHeartRate,
      quality: quality as any,
      durationMinutes,
      bedtime: bedtimeValue,
      wakeTime: wakeTimeValue,
      source: 'manual'
    }
  })
  redirect('/feed')
}

export default async function NewSleepPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return (
    <div className="max-w-2xl mx-auto card">
      <h1 className="text-xl font-semibold mb-4">Log Sleep</h1>
      <form action={createSleepAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium">Date</label>
          <input type="date" name="date" required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input name="title" className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Duration (minutes)</label>
          <input name="durationMinutes" type="number" required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Score</label>
          <input name="score" type="number" min="0" max="100" className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Resting Heart Rate</label>
          <input name="restingHeartRate" type="number" className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Quality</label>
          <select name="quality" className="w-full border rounded px-3 py-2">
            <option value="">Select</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Bedtime</label>
          <input name="bedtime" type="datetime-local" className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Wake time</label>
          <input name="wakeTime" type="datetime-local" className="w-full border rounded px-3 py-2" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium">Description</label>
          <textarea name="description" className="w-full border rounded px-3 py-2" rows={3}></textarea>
        </div>
        <div className="col-span-2">
          <button className="btn" type="submit">Save Sleep</button>
        </div>
      </form>
    </div>
  )
}
