import { useEffect, useState } from "react";
import { Send, FileText, AlertCircle, RefreshCw, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { listNegotiations, generateEmail } from "../services/api";
import type { Negotiation } from "../services/api";
import { useAnalysisStore } from "../stores/analysisStore";
import { toast } from "sonner";
import { BackButton } from "../components/common/BackButton";

interface NegotiationsProps {
    onBack: () => void;
}

export default function Negotiations({ onBack }: NegotiationsProps) {
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Load clause context from store
    const { selectedClause, getClauseById, currentAnalysis } = useAnalysisStore();

    useEffect(() => {
        loadNegotiations();
    }, []);

    const loadNegotiations = async () => {
        try {
            setLoading(true);
            const data = await listNegotiations("user_123"); // Mock user ID
            setNegotiations(Array.isArray(data) ? data : []);
        } catch (e: any) {
            console.error("Failed to load negotiations", e);
            toast.error("Failed to load negotiations");
            setNegotiations([]);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateEmail = async (id: string) => {
        setGenerating(true);
        try {
            const res = await generateEmail(id, "firm");
            if (res?.email_content) {
                // Update local state
                setNegotiations(prev => prev.map(n => 
                    n.id === id 
                        ? { ...n, email_content: res.email_content, status: "draft_generated" } 
                        : n
                ));
                toast.success("Email draft generated");
            } else {
                throw new Error("No email content received");
            }
        } catch (e: any) {
            console.error("Failed to generate email:", e);
            toast.error(e.response?.data?.detail || "Failed to generate email");
        } finally {
            setGenerating(false);
        }
    };

    const selectedNegotiation = negotiations.find(n => n.id === selectedId);
    
    // Try to get full clause context for selected negotiation
    const getClauseContext = (negotiation: Negotiation | undefined) => {
        if (!negotiation) return null;
        
        // First try to get from selected clause if it matches
        if (selectedClause && selectedClause.id === negotiation.clause_text) {
            return selectedClause;
        }
        
        // Try to get from store by clause_contested ID (if stored)
        const clauseId = (negotiation as any).clause_contested;
        if (clauseId && currentAnalysis) {
            const clause = getClauseById(clauseId);
            if (clause) return clause;
        }
        
        // Return null if no context available
        return null;
    };
    
    const clauseContext = getClauseContext(selectedNegotiation);

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 text-white font-sans">
            <header className="mb-6 md:mb-8">
                <BackButton onClick={onBack} label="Back to Dashboard" />
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                    Negotiation Tracker
                </h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 min-h-[calc(100vh-200px)] md:h-[calc(100vh-150px)]">

                {/* List Column */}
                <Card className="col-span-1 overflow-hidden flex flex-col">
                    <CardHeader>
                        <CardTitle>Active Disputes</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-2">
                        {loading ? (
                            <div className="text-center text-slate-400 py-8">Loading...</div>
                        ) : negotiations.length === 0 ? (
                            <div className="text-center text-slate-400 py-8">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No active disputes</p>
                            </div>
                        ) : (
                            negotiations.map(n => (
                            <div key={n.id}
                                onClick={() => setSelectedId(n.id)}
                                className={cn(
                                    "p-4 mb-3 rounded-lg border cursor-pointer transition-all",
                                    selectedId === n.id ? "bg-white/10 border-green-500/50" : "bg-white/5 border-white/5 hover:bg-white/10"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold">{n.company_name}</h4>
                                    <span className={cn(
                                        "text-xs px-2 py-0.5 rounded uppercase font-bold",
                                        n.status === "sent" ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400"
                                    )}>{n.status.replace("_", " ")}</span>
                                </div>
                                <p className="text-xs text-slate-400 truncate">{n.document_title || "Unknown Document"}</p>
                            </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Detail Column */}
                <Card className="md:col-span-2 relative">
                    {selectedNegotiation ? (
                        <div className="h-full flex flex-col p-4 md:p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <FileText className="text-slate-400" /> {selectedNegotiation.company_name || "Unknown Company"} Dispute
                            </h2>

                            {/* Full Clause Context (if available) */}
                            {clauseContext && (
                                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg mb-4">
                                    <h3 className="text-sm font-bold text-blue-400 mb-2 uppercase flex items-center gap-2">
                                        <Info className="h-4 w-4" /> Clause Analysis Context
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="text-blue-300 font-semibold">Category:</span>{" "}
                                            <span className="text-slate-300">{clauseContext.category}</span>
                                        </div>
                                        <div>
                                            <span className="text-blue-300 font-semibold">Severity:</span>{" "}
                                            <span className="text-slate-300">{clauseContext.severity_score}/10</span>
                                        </div>
                                        <div>
                                            <span className="text-blue-300 font-semibold">Explanation:</span>{" "}
                                            <span className="text-slate-300">{clauseContext.simplified_explanation}</span>
                                        </div>
                                        {clauseContext.legal_context && (
                                            <div>
                                                <span className="text-blue-300 font-semibold">Legal Context:</span>{" "}
                                                <span className="text-slate-300">{clauseContext.legal_context}</span>
                                            </div>
                                        )}
                                        {clauseContext.actionable_step && (
                                            <div>
                                                <span className="text-blue-300 font-semibold">Action:</span>{" "}
                                                <span className="text-slate-300">{clauseContext.actionable_step}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg mb-6">
                                <h3 className="text-sm font-bold text-red-400 mb-2 uppercase flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" /> Contested Clause
                                </h3>
                                <p className="text-sm text-slate-300 italic">
                                    "{selectedNegotiation.clause_text || "No clause text available"}"
                                </p>
                            </div>

                            {/* Parse and display rewritten clause if available */}
                            {selectedNegotiation.email_content && (
                                (() => {
                                    const content = selectedNegotiation.email_content;
                                    const rewrittenMatch = content.match(/=== REWRITTEN CLAUSE ===\s*([\s\S]*?)(?=\n=== EMAIL ===|$)/i);
                                    const emailMatch = content.match(/=== EMAIL ===\s*([\s\S]*?)$/i);
                                    const rewrittenClause = rewrittenMatch ? rewrittenMatch[1].trim() : null;
                                    const emailContent = emailMatch ? emailMatch[1].trim() : content;
                                    
                                    return (
                                        <>
                                            {rewrittenClause && (
                                                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg mb-4">
                                                    <h3 className="text-sm font-bold text-green-400 mb-2 uppercase flex items-center gap-2">
                                                        <FileText className="h-4 w-4" /> Proposed Rewritten Clause
                                                    </h3>
                                                    <div className="bg-black/30 p-3 rounded border border-green-500/10">
                                                        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                                                            {rewrittenClause}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex-1 bg-black/20 rounded-lg p-4 border border-white/10 overflow-y-auto font-mono text-sm leading-relaxed mb-4">
                                                <div className="prose prose-invert max-w-none">
                                                    {emailContent.includes("SUBJECT:") ? (
                                                        <div>
                                                            {emailContent.split(/\n/).map((line, idx) => {
                                                                if (line.startsWith("SUBJECT:")) {
                                                                    return (
                                                                        <div key={idx} className="mb-4">
                                                                            <span className="text-blue-400 font-semibold">Subject:</span>{" "}
                                                                            <span className="text-slate-200">{line.replace("SUBJECT:", "").trim()}</span>
                                                                        </div>
                                                                    );
                                                                } else if (line.startsWith("BODY:")) {
                                                                    return null; // Skip BODY: label
                                                                } else {
                                                                    return <p key={idx} className="mb-2 text-slate-300">{line || <br />}</p>;
                                                                }
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div dangerouslySetInnerHTML={{ 
                                                            __html: emailContent.replace(/\n/g, '<br/>') 
                                                        }} />
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()
                            )}
                            
                            {!selectedNegotiation.email_content && (
                                <div className="flex-1 bg-black/20 rounded-lg p-4 border border-white/10 overflow-y-auto font-mono text-sm leading-relaxed mb-4 flex flex-col items-center justify-center text-slate-500 opacity-50 min-h-[200px]">
                                    <Send className="h-12 w-12 mb-4" />
                                    <p>No draft generated yet.</p>
                                    <p className="text-xs mt-2">Click "Generate Email" to create a draft with rewritten clause</p>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 mt-4 relative z-20">
                                <Button
                                    variant="secondary"
                                    onClick={() => handleGenerateEmail(selectedNegotiation.id)}
                                    disabled={generating}
                                    className="relative z-20 w-full sm:w-auto"
                                >
                                    {generating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                    <span className="hidden sm:inline">{selectedNegotiation.email_content ? "Regenerate Draft" : "Generate Email"}</span>
                                    <span className="sm:hidden">{selectedNegotiation.email_content ? "Regenerate" : "Generate"}</span>
                                </Button>
                                {selectedNegotiation.email_content && (
                                    <Button className="bg-green-600 hover:bg-green-700 text-white relative z-20 w-full sm:w-auto">
                                        <Send className="mr-2 h-4 w-4" /> 
                                        <span className="hidden sm:inline">Send Email via Gmail</span>
                                        <span className="sm:hidden">Send Email</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500">
                            Select a dispute to view details
                        </div>
                    )}
                </Card>

            </div>
        </div>
    );
}
