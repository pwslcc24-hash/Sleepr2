import Papa from 'papaparse'
import { prisma } from '../../../lib/prisma'
import { getCurrentUser } from '../../../lib/auth'
import { redirect } from 'next/navigation'

function parseDuration(text: string) {
  const match = text.match(/(\d+)h\s*(\d+)?/)
  if (match) return parseInt(match[1]) * 60 + (match[2] ? parseInt(match[2]) : 0)
  const num = parseInt(text)
  if (!isNaN(num)) return num
  return null
}

async function importAction(formData: FormData) {
  'use server'
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  const file = formData.get('file') as File
  if (!file) return
  const text = await file.text()
  const parsed = Papa.parse(text, { header: true })
  let success = 0
  let failure = 0
  for (const row of parsed.data as any[]) {
    if (!row || !row['Date']) { failure++; continue }
    const duration = parseDuration(row['Duration'] || '')
    if (!duration) { failure++; continue }
    try {
      await prisma.sleepSession.create({
        data: {
          userId: user.id,
          date: new Date(row['Date']),
          title: row['Title'] || null,
          description: row['Description'] || null,
          score: row['Score'] ? parseInt(row['Score']) : null,
          restingHeartRate: row['Resting Heart Rate'] ? parseInt(row['Resting Heart Rate']) : null,
          quality: row['Quality'] || null,
          durationMinutes: duration,
          bedtime: row['Bedtime'] ? new Date(row['Bedtime']) : null,
          wakeTime: row['Wake Time'] ? new Date(row['Wake Time']) : null,
          source: 'csv'
        }
      })
      success++
    } catch (e) {
      failure++
    }
  }
  await prisma.importJob.create({ data: { userId: user.id, source: 'csv', totalRows: parsed.data.length, successCount: success, failureCount: failure, errorSummary: failure ? 'Some rows failed to import' : null } })
  redirect('/feed')
}

export default async function ImportPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return (
    <div className="max-w-xl mx-auto card space-y-3">
      <h1 className="text-xl font-semibold">Import Sleep from CSV</h1>
      <form action={importAction} className="space-y-2">
        <input type="file" name="file" accept=".csv" className="w-full" required />
        <button className="btn" type="submit">Upload</button>
      </form>
      <p className="text-sm text-gray-600">Columns supported: Date, Score, Resting Heart Rate, Quality, Duration, Bedtime, Wake Time.</p>
    </div>
  )
}
