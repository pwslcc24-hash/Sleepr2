import { prisma } from '../../../lib/prisma'
import { getCurrentUser } from '../../../lib/auth'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export default async function AdminImportsPage() {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'admin') redirect('/feed')
  const jobs = await prisma.importJob.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' }, take: 50 })
  return (
    <div className="card space-y-2">
      <h1 className="text-xl font-semibold">Import Jobs</h1>
      {jobs.map(job => (
        <div key={job.id} className="border rounded px-3 py-2">
          <p className="font-semibold">{job.user.email} • {job.source}</p>
          <p className="text-sm text-gray-600">{format(job.createdAt,'Pp')}</p>
          <p className="text-sm">Rows: {job.totalRows} • Success: {job.successCount} • Failure: {job.failureCount}</p>
          {job.errorSummary && <p className="text-sm text-red-600">{job.errorSummary}</p>}
        </div>
      ))}
    </div>
  )
}
