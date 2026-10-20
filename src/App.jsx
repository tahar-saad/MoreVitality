import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
import CoachRoute from './components/CoachRoute'
import CoachDashboard from './pages/coach/CoachDashboard'
import Home from './pages/Home'
import CoachingRunning from './pages/CoachingRunning'
import CoachingSportif from './pages/CoachingSportif'
import CoachingIndividuel from './pages/CoachingIndividuel'
import CoachingDuo from './pages/CoachingDuo'
import CoachingGroupe from './pages/CoachingGroupe'
import PersonnalisationTextile from './pages/PersonnalisationTextile'
import About from './pages/About'
import FAQ from './pages/FAQ'
import Contact from './pages/Contact'
import Login from './pages/Login'
import EspaceEleve from './pages/EspaceEleve'
import ProfileQuestionnaire from './pages/ProfileQuestionnaire'
import Sessions from './pages/Sessions'
import CoachSessions from './pages/coach/CoachSessions'
import CoachStudentDetail from './pages/coach/CoachStudentDetail'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Nav />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/coaching-running" element={<CoachingRunning />} />
          <Route path="/coaching-sportif" element={<CoachingSportif />} />
          <Route path="/coaching-individuel" element={<CoachingIndividuel />} />
          <Route path="/coaching-duo" element={<CoachingDuo />} />
          <Route path="/coaching-groupe" element={<CoachingGroupe />} />
          <Route path="/personnalisation-textile" element={<PersonnalisationTextile />} />
          <Route path="/qui-suis-je" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/connexion" element={<Login />} />
          <Route
            path="/espace"
            element={
              <ProtectedRoute>
                <EspaceEleve />
              </ProtectedRoute>
            }
          />
          <Route
            path="/espace/profil"
            element={
              <ProtectedRoute>
                <ProfileQuestionnaire />
              </ProtectedRoute>
            }
          />
          <Route
            path="/espace/seances"
            element={
              <ProtectedRoute>
                <Sessions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach"
            element={
              <CoachRoute>
                <CoachDashboard />
              </CoachRoute>
            }
          />
          <Route
            path="/coach/seances"
            element={
              <CoachRoute>
                <CoachSessions />
              </CoachRoute>
            }
          />
          <Route
            path="/coach/eleves/:id"
            element={
              <CoachRoute>
                <CoachStudentDetail />
              </CoachRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
