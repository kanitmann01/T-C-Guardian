import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Negotiations from './pages/Negotiations'
import Infographic from './pages/Infographic'
import Chat from './pages/Chat'
import Settings from './pages/Settings'

// Note: Home is no longer part of this internal view switcher
type View = 'dashboard' | 'negotiations' | 'infographic' | 'chat' | 'settings'

export default function GuardianApp() {
    const [view, setView] = useState<View>('dashboard')
    const [contractText, setContractText] = useState<string>("")

    return (
        <div className="relative min-h-screen w-full bg-slate-950">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_farthest-corner_at_50%_50%,rgba(15,23,42,0)_0%,rgba(59,130,246,0.1)_50%,rgba(15,23,42,1)_100%)] animate-spin-slow opacity-30"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] mix-blend-screen animate-float"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 overflow-visible">
                {view === 'dashboard' && <Dashboard onNavigate={(v) => setView(v)} onContractLoaded={setContractText} />}
                {view === 'negotiations' && <Negotiations onBack={() => setView('dashboard')} />}
                {view === 'infographic' && <Infographic onBack={() => setView('dashboard')} />}
                {view === 'chat' && <Chat onBack={() => setView('dashboard')} contextText={contractText} />}
                {view === 'settings' && <Settings onBack={() => setView('dashboard')} />}
            </div>
        </div>
    )
}
