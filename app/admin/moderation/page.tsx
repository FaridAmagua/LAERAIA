import { cookies } from 'next/headers'
import AdminLoginForm from '@/components/AdminLoginForm'
import ModerationPage from '@/components/moderation/ModerationPage'
import { getAdminSessionValue } from '@/lib/admin'

export default async function AdminModerationRoute() {
  const cookieStore = await cookies()
  const expectedSession = getAdminSessionValue()
  const currentSession = cookieStore.get('admin_session')?.value

  if (!expectedSession || currentSession !== expectedSession) {
    return (
      <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
        <h1 className="font-heading text-3xl font-semibold text-slate-100">Admin Moderation</h1>
        <p className="text-sm text-slate-300">Enter ADMIN_TOKEN to access pending submissions.</p>
        <AdminLoginForm />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <ModerationPage />
    </div>
  )
}
