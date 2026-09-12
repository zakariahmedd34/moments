import { Navigate, Route, Routes } from 'react-router-dom'
import { StatusScreen } from './components/StatusScreen'
import { useAuth } from './hooks/useAuth'
import JournalPage from './pages/JournalPage'
import WelcomePage from './pages/WelcomePage'

export default function App() {
  const { status, retry, signOut } = useAuth()

  if (status === 'loading') {
    return <StatusScreen busy />
  }

  if (status === 'unavailable') {
    return (
      <StatusScreen title="Can't reach the server" text="Check that the backend is running, then try again.">
        <div className="status-screen__actions">
          <button type="button" className="btn btn--secondary" onClick={retry}>
            Try again
          </button>
          <button type="button" className="btn btn--plain" onClick={signOut}>
            Sign out
          </button>
        </div>
      </StatusScreen>
    )
  }

  if (status === 'signedOut') {
    return (
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<JournalPage scope="everyone" />} />
      <Route path="/day/:dayKey" element={<JournalPage scope="everyone" />} />
      <Route path="/mine" element={<JournalPage scope="mine" />} />
      <Route path="/mine/day/:dayKey" element={<JournalPage scope="mine" />} />
      <Route path="/u/:username" element={<JournalPage scope="user" />} />
      <Route path="/u/:username/day/:dayKey" element={<JournalPage scope="user" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
