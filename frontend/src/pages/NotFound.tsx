import { Shield, Home, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

const GLASS = {
    bg: "bg-white/5 backdrop-blur-md",
    border: "border-white/10",
    textMuted: "text-slate-300",
    textSubtle: "text-slate-400",
};

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-8 text-white font-sans">
            <Card className={cn("max-w-2xl w-full text-center", GLASS.bg, GLASS.border, "border")}>
                <CardContent className="p-8 md:p-12">
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full bg-red-500/20 border-2 border-red-500/30 mb-6">
                            <AlertTriangle className="h-12 w-12 md:h-16 md:w-16 text-red-400" />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                            404
                        </h1>
                        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                            Objection!
                        </h2>
                        <p className={cn("text-lg md:text-xl mb-2", GLASS.textMuted)}>
                            This page has been <span className="text-red-400 font-semibold">redacted</span> or does not exist.
                        </p>
                        <p className={cn("text-sm md:text-base", GLASS.textSubtle)}>
                            The clause you're looking for has been struck from the record.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            onClick={() => navigate("/")}
                            variant="glow"
                            size="lg"
                            className="w-full sm:w-auto relative z-20"
                        >
                            <Home className="mr-2 h-5 w-5" />
                            Return to Dashboard
                        </Button>
                        <Button
                            onClick={() => navigate(-1)}
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto relative z-20"
                        >
                            Go Back
                        </Button>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/10">
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                            <Shield className="h-4 w-4" />
                            <span>T&C Guardian - Protecting users from predatory clauses since 2024</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


