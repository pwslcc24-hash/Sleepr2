import { PrismaClient } from '@prisma/client'
import { hashSync } from 'bcryptjs'
import { addDays, subDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  await prisma.reaction.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.groupMember.deleteMany()
  await prisma.group.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.importJob.deleteMany()
  await prisma.sleepSession.deleteMany()
  await prisma.user.deleteMany()

  const adminPass = hashSync('Admin123!', 10)
  const userPass = hashSync('Password123!', 10)
  const admin = await prisma.user.create({ data: { email: 'admin@sleepr.test', name: 'Admin', passwordHash: adminPass, role: 'admin' } })
  const alice = await prisma.user.create({ data: { email: 'alice@sleepr.test', name: 'Alice', passwordHash: userPass } })
  const bob = await prisma.user.create({ data: { email: 'bob@sleepr.test', name: 'Bob', passwordHash: userPass } })
  const carol = await prisma.user.create({ data: { email: 'carol@sleepr.test', name: 'Carol', passwordHash: userPass } })

  await prisma.follow.createMany({ data: [
    { followerId: alice.id, followingId: bob.id },
    { followerId: alice.id, followingId: carol.id },
    { followerId: bob.id, followingId: alice.id },
  ] })

  const users = [admin, alice, bob, carol]
  for (const user of users) {
    for (let i = 0; i < 5; i++) {
      const date = subDays(new Date(), i)
      await prisma.sleepSession.create({
        data: {
          userId: user.id,
          date,
          title: `${user.name || 'User'} sleep ${i + 1}`,
          description: 'Seed sleep entry',
          score: 70 + i,
          restingHeartRate: 55 + i,
          quality: ['Excellent','Good','Fair','Poor'][i % 4] as any,
          durationMinutes: 7 * 60 + i * 10,
          bedtime: subDays(new Date(), i),
          wakeTime: subDays(new Date(), i - 1),
          source: 'manual'
        }
      })
    }
  }

  const sessions = await prisma.sleepSession.findMany({ take: 5 })
  await prisma.comment.create({ data: { userId: alice.id, sleepSessionId: sessions[0].id, text: 'Nice sleep!' } })
  await prisma.reaction.create({ data: { userId: bob.id, sleepSessionId: sessions[0].id, type: 'like' } })

  const group = await prisma.group.create({ data: { name: 'Restful Club', description: 'We love sleep', ownerId: admin.id } })
  await prisma.groupMember.createMany({ data: [
    { groupId: group.id, userId: admin.id, role: 'owner' },
    { groupId: group.id, userId: alice.id, role: 'member' },
    { groupId: group.id, userId: bob.id, role: 'member' },
  ] })

  await prisma.importJob.create({ data: { userId: alice.id, source: 'csv', totalRows: 3, successCount: 3, failureCount: 0, errorSummary: null } })
  await prisma.importJob.create({ data: { userId: bob.id, source: 'csv', totalRows: 4, successCount: 3, failureCount: 1, errorSummary: 'One row missing duration' } })
}

main().catch(e => {
  console.error(e)
}).finally(async () => {
  await prisma.$disconnect()
})
