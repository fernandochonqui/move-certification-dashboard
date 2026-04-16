import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LoginButton from '@/components/LoginButton'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')

  const { error } = await searchParams

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">M</div>
        <div className="login-title">MOVE Certification Dashboard</div>
        <div className="login-sub">Sign in with your PandaDoc account to continue.</div>
        <LoginButton />
        {error && (
          <div style={{ marginTop: '1rem', fontSize: 12, color: '#a32d2d' }}>
            Access denied. Only @pandadoc.com accounts are allowed.
          </div>
        )}
        <div className="login-footer">Restricted to @pandadoc.com accounts only.</div>
      </div>
    </div>
  )
}
