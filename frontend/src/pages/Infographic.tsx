import { motion } from "framer-motion";
import { Database, Server, Smartphone, User, ShieldAlert, Eye, X, Activity } from "lucide-react";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { BackButton } from "../components/common/BackButton";

interface InfographicProps {
    onBack: () => void;
}

export default function Infographic({ onBack }: InfographicProps) {
    const steps = [
        {
            icon: <User className="h-8 w-8 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />,
            title: "You (The User)",
            desc: "You sign up, thinking it's just a service.",
            x: 0, y: 0
        },
        {
            icon: <Smartphone className="h-8 w-8 text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]" />,
            title: "App Collection",
            desc: "IP Address, Location, Device ID are scraped immediately.",
            x: 100, y: 50,
            delay: 0.5
        },
        {
            icon: <Server className="h-8 w-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />,
            title: "Company Servers",
            desc: "Data is stored indefinitely. 'Retention: Forever'.",
            x: 200, y: 0,
            delay: 1.0
        },
        {
            icon: <Database className="h-8 w-8 text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]" />,
            title: "Third-Party Brokers",
            desc: "Data is sold/shared with 'Partners' & Ad Networks.",
            x: 300, y: 50,
            delay: 1.5,
            alert: true
        },
        {
            icon: <Eye className="h-8 w-8 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]" />,
            title: "Targeted Ads",
            desc: "Your data returns as 'personalized' manipulation.",
            x: 400, y: 0,
            delay: 2.0
        }
    ];

    return (
        <div className="min-h-screen p-4 md:p-8 text-white font-sans overflow-hidden relative">

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-12 relative z-10">
                <div className="flex items-center gap-3">
                    <Activity className="h-6 w-6 md:h-8 md:w-8 text-pink-500 animate-pulse" />
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent neon-text">
                        The Data Harvest
                    </h1>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <BackButton onClick={onBack} label="Back to Dashboard" className="mb-0" />
                    <Button variant="outline" onClick={onBack} className="hover:border-pink-500/50 hover:bg-pink-500/10 hover:text-pink-300 relative z-20 w-full sm:w-auto">
                        <X className="mr-2 h-4 w-4" /> 
                        <span className="hidden sm:inline">Close Visualization</span>
                        <span className="sm:hidden">Close</span>
                    </Button>
                </div>
            </header>

            {/* Central Stage */}
            <div className="relative h-[400px] md:h-[600px] w-full max-w-6xl mx-auto glass-panel rounded-3xl p-4 md:p-8 flex items-center justify-center overflow-hidden">

                {/* Background Grid */}
                <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 gap-8 opacity-20 pointer-events-none">
                    {[...Array(48)].map((_, i) => (
                        <div key={i} className="border-[0.5px] border-dashed border-white/10 rounded-sm" />
                    ))}
                </div>

                {/* Flow Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                    <defs>
                        <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#60a5fa" />
                            <stop offset="50%" stopColor="#c084fc" />
                            <stop offset="100%" stopColor="#f472b6" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <motion.path
                        d="M 150 300 C 300 300, 300 400, 450 300 S 600 200, 750 300 S 900 400, 1050 300"
                        fill="none"
                        stroke="url(#line-gradient)"
                        strokeWidth="4"
                        strokeDasharray="10 10"
                        filter="url(#glow)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 3, ease: "easeInOut" }}
                    />
                </svg>

                {/* Nodes */}
                <div className="flex justify-between w-full items-center relative z-10 px-10">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: step.delay, duration: 0.6, type: "spring" }}
                            className="flex flex-col items-center text-center max-w-[180px] group"
                        >
                            <div className={cn(
                                "h-24 w-24 rounded-2xl bg-slate-900/80 border-2 flex items-center justify-center mb-6 shadow-2xl relative transition-transform duration-300 group-hover:-translate-y-2 backdrop-blur-md",
                                step.alert ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]" : "border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:border-blue-400/50"
                            )}>
                                {step.icon}

                                {step.alert && (
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute -top-3 -right-3 bg-red-600 p-1.5 rounded-full border border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                                    >
                                        <ShieldAlert className="h-5 w-5 text-white" />
                                    </motion.div>
                                )}
                            </div>
                            <h3 className="font-bold text-xl mb-2 text-white">{step.title}</h3>
                            <p className="text-sm text-slate-400 leading-tight">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Data Packets Animation */}
                <motion.div
                    className="absolute top-1/2 -left-4 h-4 w-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)] z-20"
                    animate={{
                        offsetDistance: "100%",
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    style={{ offsetPath: "path('M 150 300 C 300 300, 300 400, 450 300 S 600 200, 750 300 S 900 400, 1050 300')" }}
                />
                <motion.div
                    className="absolute top-1/2 -left-4 h-3 w-3 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,1)] z-20"
                    animate={{
                        offsetDistance: "100%",
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1 }}
                    style={{ offsetPath: "path('M 150 300 C 300 300, 300 400, 450 300 S 600 200, 750 300 S 900 400, 1050 300')" }}
                />
            </div>

            <div className="mt-12 text-center">
                <p className="text-slate-400 max-w-3xl mx-auto text-lg">
                    "Most users click 'Agree' in <span className="text-white font-bold text-glow">4 seconds</span>.
                    This grants companies a perpetual license to your digital soul."
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
                        ⚠️ Data Sold: Unlimited
                    </div>
                    <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 text-sm">
                        🔒 Privacy: 0%
                    </div>
                </div>
            </div>

        </div>
    );
}
