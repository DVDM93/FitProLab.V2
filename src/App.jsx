import { useState } from 'react'
import Layout from './components/Layout/Layout'
import AdminDashboard from './pages/AdminDashboard'
import MemberDashboard from './pages/MemberDashboard'

function App() {
  const [view, setView] = useState('admin'); // 'admin' or 'member'

  return (
    <Layout view={view} setView={setView}>
      {view === 'admin' ? <AdminDashboard /> : <MemberDashboard />}
    </Layout>
  )
}

export default App
