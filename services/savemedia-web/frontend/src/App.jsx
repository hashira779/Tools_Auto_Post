import { useState, lazy, Suspense } from 'react'
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { TOOL_PATHS, toolFromPath } from './routes'

import AppNavbar from './components/AppNavbar'
import AppSidebar from './components/AppSidebar'
import Footer from './components/Footer'
import VerificationOverlay from './components/VerificationOverlay'
import DownloaderPage from './pages/DownloaderPage'
import PdfToolsPage from './pages/PdfToolsPage'

// Lazy load heavy tool chunks so the main downloader loads instantly
const TtsStudio = lazy(() => import('./components/tts/TtsStudio'))
const StickerHero = lazy(() => import('./components/sticker/StickerHero'))
const StickerStudio = lazy(() => import('./components/sticker/StickerStudio'))
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'))
const LiveCameraContainer = lazy(() => import('./components/livecamera/LiveCameraContainer'))

const Skeleton = ({ className = 'w-full h-64 animate-pulse bg-[var(--color-surface-2)] rounded-xl mt-8' }) => (
  <div className={className}></div>
)

/** Standard centered page shell used by most tools. */
function ToolShell({ children }) {
  return (
    <div className="flex-1 w-full max-w-[1024px] mx-auto px-5 sm:px-6 lg:px-8 pt-12 pb-20">
      {children}
    </div>
  )
}

/** Admin route guard — redirects non-admins to home. */
function RequireAdmin({ children }) {
  const { dbUser, loading } = useAuth()
  if (loading) return <ToolShell><Skeleton /></ToolShell>
  if (!dbUser?.is_admin) return <Navigate to="/" replace />
  return children
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Initialize Auth at the root so OAuth redirects are caught regardless of route
  useAuth()

  const activeTool = toolFromPath(location.pathname)
  const isGuestShare = location.pathname.startsWith('/share/')

  const handleSelectTool = (toolId) => {
    const path = TOOL_PATHS[toolId] || '/'
    navigate(path)
  }

  return (
    <>
      {/* Mobile Menu Drawer */}
      <AppSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeTool={activeTool}
        onSelectTool={handleSelectTool}
      />

      <VerificationOverlay />

      {/* Main Layout */}
      <div className="relative min-h-screen flex flex-col">
        {/* The Animated Mesh Gradient Background */}
        <div className="mesh-bg"></div>

        {/* Top Navbar (hidden for fullscreen guest camera view) */}
        {!isGuestShare && (
          <AppNavbar
            activeTool={activeTool}
            onSelectTool={handleSelectTool}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />
        )}

        <Routes>
          {/* Media Downloader (home) */}
          <Route path="/" element={<ToolShell><DownloaderPage /></ToolShell>} />

          {/* Text-to-Voice Studio */}
          <Route path="/tts" element={
            <ToolShell>
              <main className="flex flex-col items-center animate-fade-in">
                <Suspense fallback={<Skeleton />}>
                  <TtsStudio />
                </Suspense>
              </main>
            </ToolShell>
          } />

          {/* Telegram Sticker Studio */}
          <Route path="/sticker" element={
            <div className="flex-1 w-full max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-8 pt-6 pb-6 flex flex-col items-center">
              <main className="w-full flex flex-col items-center animate-fade-in flex-1">
                <Suspense fallback={<Skeleton />}>
                  <StickerStudio />
                </Suspense>
              </main>
            </div>
          } />

          {/* PDF Tools (Stirling-PDF iframe) */}
          <Route path="/pdf-tools" element={<PdfToolsPage />} />

          {/* Live Camera — host studio */}
          <Route path="/live" element={
            <ToolShell>
              <main className="flex flex-col items-center animate-fade-in w-full">
                <Suspense fallback={<Skeleton className="w-full h-96 animate-pulse bg-[var(--color-surface-2)] rounded-2xl" />}>
                  <LiveCameraContainer />
                </Suspense>
              </main>
            </ToolShell>
          } />

          {/* Live Camera — guest fullscreen view */}
          <Route path="/share/:roomId" element={
            <div className="flex-1 w-full h-full flex flex-col absolute inset-0 z-50 bg-[#000000]">
              <Suspense fallback={<div className="w-full h-full animate-pulse bg-zinc-900"></div>}>
                <LiveCameraContainer />
              </Suspense>
            </div>
          } />

          {/* Admin Dashboard (guarded) */}
          <Route path="/admin" element={
            <RequireAdmin>
              <ToolShell>
                <main className="flex flex-col items-center animate-fade-in w-full">
                  <Suspense fallback={<Skeleton />}>
                    <AdminDashboard />
                  </Suspense>
                </main>
              </ToolShell>
            </RequireAdmin>
          } />

          {/* Unknown routes → home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {activeTool !== 'pdf' && activeTool !== 'screen-share' && <Footer />}
      </div>
    </>
  )
}

export default App
