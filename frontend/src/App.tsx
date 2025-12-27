import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import GuardianApp from './GuardianApp'
import NotFound from './pages/NotFound'
import { Toaster } from './components/ui/toaster'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/app/*" element={<GuardianApp />} />
          {/* Custom 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
