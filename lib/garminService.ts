import { prisma } from './prisma'
import { addDays, subDays } from 'date-fns'

// TODO: Replace fake Garmin sync with real Garmin API integration.
export async function syncGarminSleepForUser(userId: string) {
  const now = new Date()
  const sessions = await prisma.sleepSession.findMany({ where: { userId, source: 'garmin' }, take: 5 })
  if (sessions.length > 0) return { created: 0 }
  const createPromises = Array.from({ length: 3 }).map((_, idx) => {
    const date = subDays(now, idx + 1)
    return prisma.sleepSession.create({
      data: {
        userId,
        date,
        title: `Garmin Sync ${idx + 1}`,
        description: 'Auto-imported from Garmin (placeholder)',
        score: 75 + idx,
        restingHeartRate: 55 + idx,
        quality: 'Good',
        durationMinutes: 7 * 60 + idx * 10,
        bedtime: subDays(addDays(now, -idx), 0),
        wakeTime: now,
        source: 'garmin'
      }
    })
  })
  await Promise.all(createPromises)
  return { created: createPromises.length }
}
