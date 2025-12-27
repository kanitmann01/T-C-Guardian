
import { Shield, Check, ArrowRight, Upload, Lock } from "lucide-react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();

    const handleStart = () => {
        navigate('/app');
    };

    const handleScrollToFeatures = () => {
        const element = document.getElementById('features');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden">

            {/* Nav */}
            <nav className="flex justify-between items-center p-8 max-w-7xl mx-auto relative z-[100] pointer-events-auto">
                <div className="flex items-center gap-2">
                    <Shield className="h-8 w-8 text-blue-500" />
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">T&C Guardian</span>
                </div>
                <div className="flex gap-4">
                    <Button variant="ghost" onClick={handleScrollToFeatures} className="cursor-pointer hover:bg-white/10">How it Works</Button>
                    <Button onClick={handleStart} className="cursor-pointer z-50">Get Protected</Button>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative pt-20 pb-32 overflow-hidden px-8 pointer-events-auto">
                {/* Background Blob - Low Z-Index */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none z-0" />

                {/* Content - High Z-Index */}
                <div className="max-w-4xl mx-auto text-center relative z-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-blue-300 mb-6 backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Now with Geo-Legal Context (Beta)
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight relative z-20">
                        Don't Sign Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Rights Away.</span>
                    </h1>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto relative z-20">
                        The AI-powered "Paranoid Lawyer" that reads the fine print so you don't have to.
                        Detect predatory clauses, hidden fees, and data traps in seconds.
                    </p>
                    <div className="flex justify-center gap-4 relative z-30 pointer-events-auto">
                        <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 cursor-pointer relative z-40 pointer-events-auto" onClick={handleStart}>
                            Analyze a Contract <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button size="lg" variant="secondary" className="h-14 px-8 text-lg cursor-pointer relative z-40 pointer-events-auto" onClick={handleStart}>
                            View Demo
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features (Bento) */}
            <section id="features" className="py-20 px-8 bg-slate-900/50">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Feature 1 */}
                        <div className="md:col-span-2 bg-slate-800/50 p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-30 transition-opacity">
                                <Upload className="h-40 w-40" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Instant Analysis</h3>
                            <p className="text-slate-400 max-w-sm">
                                Drag & drop any PDF or copy-paste a URL. Our engine reads 50 pages of legalese in under 10 seconds.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 rounded-3xl border border-white/10 flex flex-col justify-between">
                            <Shield className="h-12 w-12 text-white mb-6" />
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Paranoid AI</h3>
                                <p className="text-white/80">Specifically tuned to find "gotchas" that generic AIs miss.</p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-slate-800/50 p-8 rounded-3xl border border-white/5">
                            <Lock className="h-12 w-12 text-green-400 mb-6" />
                            <h3 className="text-2xl font-bold mb-2">Private by Design</h3>
                            <p className="text-slate-400">Contracts are analyzed in-memory and hashed for caching. We don't train on your data.</p>
                        </div>

                        {/* Feature 4 */}
                        <div className="md:col-span-2 bg-slate-800/50 p-8 rounded-3xl border border-white/5 flex items-center gap-8">
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold mb-4">Negotiation Tracker</h3>
                                <p className="text-slate-400 mb-6">
                                    Don't just read it, fight it. Generate legal opt-out emails for arbitration clauses and track your disputes.
                                </p>
                                <div className="flex gap-2 text-sm text-slate-300">
                                    <div className="flex items-center gap-1"><Check className="h-4 w-4 text-blue-400" /> GDPR Compliant</div>
                                    <div className="flex items-center gap-1"><Check className="h-4 w-4 text-blue-400" /> CCPA Ready</div>
                                </div>
                            </div>
                            <div className="hidden md:block bg-slate-950 p-4 rounded-xl border border-white/10 -rotate-3 hover:rotate-0 transition-transform">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-2 w-2 rounded-full bg-red-500" />
                                    <div className="h-2 w-20 bg-slate-800 rounded" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-32 bg-slate-800 rounded" />
                                    <div className="h-2 w-24 bg-slate-800 rounded" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="py-12 text-center text-slate-500 text-sm">
                &copy; 2024 T&C Guardian. Built for consumer rights.
            </footer>

        </div>
    );
}
