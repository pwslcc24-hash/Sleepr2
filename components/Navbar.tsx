import Link from 'next/link'
import { getCurrentUser, clearSession } from '../lib/auth'
import { prisma } from '../lib/prisma'
import { redirect } from 'next/navigation'

async function logoutAction() {
  'use server'
  clearSession()
  redirect('/login')
}

export default async function Navbar() {
  const user = await getCurrentUser()
  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/feed" className="text-xl font-semibold text-indigo-600">Sleepr</Link>
          {user && (
            <>
              <Link href="/feed" className="text-sm font-medium text-gray-700">Feed</Link>
              <Link href="/sleep/new" className="text-sm font-medium text-gray-700">Add Sleep</Link>
              <Link href={`/u/${user.id}`} className="text-sm font-medium text-gray-700">Profile</Link>
              <Link href="/groups" className="text-sm font-medium text-gray-700">Groups</Link>
              {user.role === 'admin' && <Link href="/admin" className="text-sm font-medium text-gray-700">Admin</Link>}
            </>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {user ? (
            <form action={logoutAction}>
              <button className="text-sm font-medium text-gray-700">Logout</button>
            </form>
          ) : (
            <>
              <Link href="/login" className="text-sm">Login</Link>
              <Link href="/signup" className="text-sm">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
