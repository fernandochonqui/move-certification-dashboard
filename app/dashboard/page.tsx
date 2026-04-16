import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/DashboardClient'
import SignOutButton from '@/components/SignOutButton'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { name, email, isAdmin } = session.user

  return (
    <>
      <header className="app-header">
        <span className="app-header-title">MOVE Certification Dashboard</span>
        <div className="app-header-user">
          {isAdmin && <span className="admin-badge">Editor</span>}
          <span>{name ?? email}</span>
          <SignOutButton />
        </div>
      </header>
      <div className="dashboard-wrapper">
        <DashboardClient isAdmin={isAdmin} />
      </div>
    </>
  )
}
