import React, { useState, useEffect } from "react";
import { Upload, FileText, Shield, Gavel, MessageSquare, Settings, Activity, CheckCircle2, AlertTriangle, Loader2, ChevronDown, ChevronUp, ChevronRight, ShieldAlert, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { ingestFile, analyzeText, createNegotiation } from "../services/api";
import type { AnalysisResponse, Clause } from "../services/api";
import { toast } from "sonner";
import { useAnalysisStore } from "../stores/analysisStore";
import { useHistoryStore, type AnalysisHistoryItem } from "../stores/historyStore";
import { LoadingSpinner, ClauseCardSkeleton } from "../components/common/LoadingSpinner";
import { BackButton } from "../components/common/BackButton";

interface DashboardProps {
    onNavigate: (view: 'dashboard' | 'negotiations' | 'chat' | 'settings' | 'infographic') => void;
    onContractLoaded?: (text: string) => void;
}

// Glassmorphism design system constants
const GLASS = {
    bg: "bg-white/5 backdrop-blur-md",
    bgHover: "bg-white/10",
    border: "border-white/10",
    borderHover: "border-white/20",
    text: "text-white",
    textMuted: "text-slate-300",
    textSubtle: "text-slate-400",
};

// Spacing system
const SPACING = {
    xs: "gap-2",
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8",
};

// Danger score color mapping with gradient zones
const getDangerColor = (score: number) => {
    if (score >= 80) return "text-red-500";
    if (score >= 50) return "text-orange-500";
    if (score >= 20) return "text-yellow-500";
    return "text-green-500";
};

const getDangerBg = (score: number) => {
    if (score >= 80) return "bg-red-500/20 border-red-500/30";
    if (score >= 50) return "bg-orange-500/20 border-orange-500/30";
    if (score >= 20) return "bg-yellow-500/20 border-yellow-500/30";
    return "bg-green-500/20 border-green-500/30";
};

export default function Dashboard({ onNavigate, onContractLoaded }: DashboardProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isNegotiating, setIsNegotiating] = useState<string | null>(null);
    const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set());
    const [jurisdiction, setJurisdiction] = useState("California");
    const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
    const [pastedText, setPastedText] = useState("");
    
    const {
        currentAnalysis: result,
        setAnalysis,
        setDocumentMetadata,
        setSelectedClause,
    } = useAnalysisStore();
    
    // Session-based history store (wipes on tab close)
    const { scans: history, addScan } = useHistoryStore();

    useEffect(() => {
        const stored = localStorage.getItem("tc_jurisdiction");
        if (stored) {
            const map: Record<string, string> = {
                "US_CALIFORNIA": "California (CCPA)",
                "EU_GDPR": "EU (GDPR)",
                "INDIA_IT_ACT": "India (IT Act)",
                "US-CA": "California (CCPA)",
                "EU-GDPR": "EU (GDPR)",
            };
            setJurisdiction(map[stored] || stored);
        }
    }, []);

    // Dynamic page title based on analysis state
    useEffect(() => {
        if (result?.analysis_result) {
            document.title = `Analysis Results | T&C Guardian`;
        } else if (isAnalyzing) {
            document.title = `Analyzing... | T&C Guardian`;
        } else {
            document.title = `T&C Guardian | Paranoid Lawyer`;
        }
    }, [result, isAnalyzing]);


    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await processFile(e.dataTransfer.files[0]);
        }
    };

    const processFile = async (uploadedFile: File) => {
        try {
            setIsAnalyzing(true);
            setFile(uploadedFile);
            toast.info("Uploading file...");
            
            const ingestRes = await ingestFile(uploadedFile);
            if (ingestRes.status === "error") {
                toast.error(ingestRes.message || "Failed to process file");
                return;
            }

            const extractedText = ingestRes.text || ingestRes.preview || "";
            if (!extractedText) {
                toast.warning("No text found in this document. Is it a scanned image?");
                return;
            }

            toast.info("Analyzing contract clauses...");
            const currentJurisdiction = localStorage.getItem("tc_jurisdiction") || "US-CA";
            const documentTitle = uploadedFile.name || "Unknown Contract";
            const companyName = "Service Provider"; // Could be extracted from document or user input
            
            const analysisRes = await analyzeText(extractedText, currentJurisdiction);
            
            setAnalysis(analysisRes);
            setDocumentMetadata(documentTitle, companyName, extractedText);
            
            // Save to session history (client-side only, wipes on tab close)
            if (analysisRes.analysis_result) {
                addScan({
                    id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    document_title: documentTitle,
                    company_name: companyName,
                    overall_danger_score: analysisRes.analysis_result.overall_danger_score,
                    clause_count: analysisRes.analysis_result.clauses?.length || 0,
                    analyzed_at: new Date().toISOString(),
                    jurisdiction: currentJurisdiction,
                });
            }
            
            // Celebration for safe contracts
            const dangerScore = analysisRes.analysis_result?.overall_danger_score || 0;
            if (dangerScore < 20) {
                toast.success("🎉 Great news! This contract appears relatively safe.", {
                    duration: 5000,
                });
            } else {
                toast.success("Analysis Complete");
            }

            if (onContractLoaded) {
                onContractLoaded(extractedText);
            }
        } catch (error: any) {
            console.error("Processing failed:", error);
            const errorMsg = error.response?.data?.detail || error.message || "Failed to process file";
            toast.error(errorMsg, {
                action: {
                    label: "Retry",
                    onClick: () => uploadedFile && processFile(uploadedFile),
                },
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAnalyzeText = async () => {
        if (!pastedText.trim()) {
            toast.error("Please paste some text first");
            return;
        }

        try {
            setIsAnalyzing(true);
            toast.info("Analyzing text...");
            const currentJurisdiction = localStorage.getItem("tc_jurisdiction") || "US-CA";
            const analysisRes = await analyzeText(pastedText, currentJurisdiction);
            
            setAnalysis(analysisRes);
            setDocumentMetadata("Pasted Text", "Service Provider", pastedText);
            
            // Save to session history (client-side only, wipes on tab close)
            if (analysisRes.analysis_result) {
                addScan({
                    id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    document_title: "Pasted Text",
                    company_name: "Service Provider",
                    overall_danger_score: analysisRes.analysis_result.overall_danger_score,
                    clause_count: analysisRes.analysis_result.clauses?.length || 0,
                    analyzed_at: new Date().toISOString(),
                    jurisdiction: currentJurisdiction,
                });
            }
            
            const dangerScore = analysisRes.analysis_result?.overall_danger_score || 0;
            if (dangerScore < 20) {
                toast.success("🎉 Great news! This contract appears relatively safe.", {
                    duration: 5000,
                });
            } else {
                toast.success("Analysis Complete");
            }

            if (onContractLoaded) {
                onContractLoaded(pastedText);
            }
        } catch (error: any) {
            console.error("Analysis failed:", error);
            const errorMsg = error.response?.data?.detail || error.message || "Failed to analyze text";
            toast.error(errorMsg, {
                action: {
                    label: "Retry",
                    onClick: handleAnalyzeText,
                },
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleNegotiate = async (clause: Clause) => {
        try {
            setIsNegotiating(clause.id);
            setSelectedClause(clause);
            
            const store = useAnalysisStore.getState();
            const negotiationData = {
                user_id: "user_123",
                document_title: store.documentTitle || file?.name || "Unknown Contract",
                company_name: store.companyName || "Service Provider",
                clause: {
                    id: clause.id,
                    clause_text: clause.clause_text || "",
                    category: clause.category || "Unknown",
                    simplified_explanation: clause.simplified_explanation || "",
                    severity_score: clause.severity_score || 5,
                    legal_context: clause.legal_context || "",
                    actionable_step: clause.actionable_step || "",
                    flags: clause.flags || []
                }
            };
            
            await createNegotiation(negotiationData);
            toast.success("Negotiation created successfully");
            onNavigate('negotiations');
        } catch (e: any) {
            const errorMessage = e.response?.data?.detail || e.message || "Failed to start negotiation";
            toast.error(errorMessage);
        } finally {
            setIsNegotiating(null);
        }
    };

    const toggleClauseExpansion = (clauseId: string) => {
        setExpandedClauses(prev => {
            const next = new Set(prev);
            if (next.has(clauseId)) {
                next.delete(clauseId);
            } else {
                next.add(clauseId);
            }
            return next;
        });
    };

    const dangerScore = result?.analysis_result?.overall_danger_score ?? 0;
    const clauses = result?.analysis_result?.clauses || [];
    const hasClauses = clauses.length > 0;

    return (
        <div className="min-h-screen p-4 md:p-8 pb-8 md:pb-12 text-white font-sans">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-10 relative z-20">
                <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 md:h-10 md:w-10 text-blue-500 animate-pulse" />
                    <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                        T&C Guardian
                    </h1>
                </div>
                <div className={cn(
                    "flex flex-wrap items-center gap-2 md:gap-4 px-3 md:px-4 py-2 rounded-full w-full md:w-auto",
                    GLASS.bg, GLASS.border, "border relative z-20"
                )}>
                    <div className="text-xs md:text-sm">
                        <span className={GLASS.textSubtle}>Jurisdiction:</span>{" "}
                        <span className="text-blue-400 font-semibold">{jurisdiction}</span>
                    </div>
                    <div className="h-4 w-px bg-white/10 hidden md:block" />
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onNavigate('infographic')}
                        className="text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 transition-all duration-200 relative z-20"
                    >
                        <Activity className="mr-2 h-4 w-4" /> 
                        <span className="hidden sm:inline">Visualize Risks</span>
                        <span className="sm:hidden">Risks</span>
                    </Button>
                    <div className="h-4 w-px bg-white/10 hidden md:block" />
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onNavigate('settings')}
                        className="transition-all duration-200 relative z-20"
                    >
                        <Settings className="h-5 w-5 text-slate-400 hover:text-white" />
                    </Button>
                    {result?.analysis_result && (
                        <Button 
                            size="sm" 
                            variant="glow" 
                            onClick={() => onNavigate('chat')}
                            className="transition-all duration-200 relative z-20"
                        >
                            <MessageSquare className="mr-2 h-4 w-4" /> 
                            <span className="hidden sm:inline">Ask Contract</span>
                            <span className="sm:hidden">Chat</span>
                        </Button>
                    )}
                </div>
            </header>

            <div className={cn("grid grid-cols-1 md:grid-cols-3 relative z-10", SPACING.md, "md:" + SPACING.lg)}>
                {/* Main Zone */}
                <Card className={cn("md:col-span-2 relative overflow-visible group min-h-[400px] md:min-h-[500px]", GLASS.bg, GLASS.border, "border")}>
                    {!result ? (
                        <>
                            {/* Input Method Toggle */}
                            <div className="flex justify-center mb-6 relative z-30 pt-6">
                                <div className={cn("p-1 rounded-lg flex gap-1", GLASS.bg, GLASS.border, "border")}>
                                    <button
                                        onClick={() => setUploadMode('file')}
                                        disabled={isAnalyzing}
                                        className={cn(
                                            "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                            uploadMode === 'file' 
                                                ? "bg-blue-600 text-white shadow-lg" 
                                                : "text-slate-400 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <Upload className="h-4 w-4 inline-block mr-2" />
                                        Upload File
                                    </button>
                                    <button
                                        onClick={() => setUploadMode('text')}
                                        disabled={isAnalyzing}
                                        className={cn(
                                            "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                            uploadMode === 'text' 
                                                ? "bg-blue-600 text-white shadow-lg" 
                                                : "text-slate-400 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <FileText className="h-4 w-4 inline-block mr-2" />
                                        Paste Text
                                    </button>
                                </div>
                            </div>

                            {uploadMode === 'file' ? (
                                <CardContent 
                                    className={cn(
                                        "relative z-20 flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl border-2 border-dashed min-h-[400px] md:min-h-[500px] transition-all duration-300",
                                        isDragging 
                                            ? "border-blue-500/50 bg-blue-500/5" 
                                            : GLASS.border + " group-hover:border-blue-500/30 group-hover:bg-white/5"
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto space-y-6">
                                        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-8 rounded-full animate-float shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                            <Upload className="h-12 w-12 text-blue-300" />
                                        </div>
                                        <h3 className="text-2xl font-medium text-white pointer-events-none tracking-tight text-center">
                                            Feed the Machine
                                        </h3>
                                        <p className={cn("pointer-events-none max-w-sm text-center", GLASS.textSubtle)}>
                                            Drag & Drop your contract (PDF, DOCX) to analyze pseudo-legal gibberish.
                                        </p>

                                        <div className="text-center relative z-[100] w-full flex justify-center pt-2">
                                            <Button 
                                                variant="glow" 
                                                disabled={isAnalyzing} 
                                                className="h-12 px-8 text-base transition-all duration-200 relative z-[100]"
                                            >
                                                {isAnalyzing ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Analyzing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <label className="cursor-pointer flex items-center justify-center w-full h-full">
                                                            Browse Files
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    if (e.target.files?.[0]) {
                                                                        processFile(e.target.files[0]);
                                                                    }
                                                                }}
                                                                accept=".pdf,.docx,.txt"
                                                                disabled={isAnalyzing}
                                                            />
                                                        </label>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        {isAnalyzing && (
                                            <p className="text-xs text-blue-400 animate-pulse text-center">
                                                Decrypting legalese...
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            ) : (
                                <CardContent className="relative z-20 flex flex-col items-center h-full m-6 rounded-2xl min-h-[400px] overflow-visible">
                                    <div className="w-full h-full flex flex-col flex-1 overflow-visible">
                                        <textarea
                                            value={pastedText}
                                            onChange={(e) => setPastedText(e.target.value)}
                                            placeholder="Paste your Terms & Conditions here..."
                                            disabled={isAnalyzing}
                                            className={cn(
                                                "w-full flex-1 rounded-xl p-4 mb-4 text-sm font-mono leading-relaxed resize-none custom-scrollbar transition-all duration-200",
                                                "bg-slate-950/50 border focus:outline-none focus:border-blue-500/50",
                                                GLASS.border, GLASS.textMuted, "placeholder:text-slate-600"
                                            )}
                                        />
                                        <div className="flex justify-end relative z-[100] mb-2">
                                            <Button
                                                variant="glow"
                                                disabled={isAnalyzing || !pastedText.trim()}
                                                onClick={handleAnalyzeText}
                                                className="h-12 px-8 text-base w-full md:w-auto transition-all duration-200 relative z-[100]"
                                            >
                                                {isAnalyzing ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Analyzing...
                                                    </>
                                                ) : (
                                                    "Analyze Text"
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </>
                    ) : isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center h-full p-6">
                            <LoadingSpinner size="lg" text="Analyzing contract..." />
                            <div className="mt-8 w-full max-w-md space-y-4">
                                <ClauseCardSkeleton />
                                <ClauseCardSkeleton />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <FileText className="h-6 w-6 text-blue-400" /> Analysis Report
                                </h3>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                        useAnalysisStore.getState().clearAnalysis();
                                        setFile(null);
                                        setPastedText("");
                                    }}
                                    className="transition-all duration-200"
                                >
                                    Analyze New Document
                                </Button>
                            </div>
                            
                            {/* Empty State - Safe Contract */}
                            {!hasClauses && dangerScore < 20 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="bg-green-500/20 p-6 rounded-full mb-6">
                                        <CheckCircle2 className="h-16 w-16 text-green-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-green-400 mb-2">
                                        🎉 Contract Looks Safe!
                                    </h3>
                                    <p className={cn("max-w-md", GLASS.textMuted)}>
                                        No significant issues detected. This contract appears to be relatively fair and balanced.
                                    </p>
                                </div>
                            ) : !hasClauses ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <AlertTriangle className="h-16 w-16 text-yellow-400 mb-4" />
                                    <p className={GLASS.textMuted}>No clauses found in analysis</p>
                                </div>
                            ) : (
                                <div className={cn("space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[600px]", SPACING.sm)}>
                                    {clauses.map((clause) => {
                                        const isExpanded = expandedClauses.has(clause.id);
                                        const shouldTruncate = clause.clause_text.length > 200;
                                        const displayText = isExpanded || !shouldTruncate 
                                            ? clause.clause_text 
                                            : clause.clause_text.substring(0, 200);
                                        
                                        return (
                                            <div 
                                                key={clause.id} 
                                                className={cn(
                                                    "p-5 rounded-xl border transition-all duration-200 group",
                                                    GLASS.bg, GLASS.border, "hover:" + GLASS.borderHover, "hover:" + GLASS.bgHover
                                                )}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border",
                                                        clause.severity_score >= 7 
                                                            ? "bg-red-500/20 text-red-300 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
                                                            : clause.severity_score >= 4 
                                                                ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" 
                                                                : "bg-green-500/20 text-green-300 border-green-500/30"
                                                    )}>
                                                        {clause.category} | Score: {clause.severity_score}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        {clause.flags?.map(f => (
                                                            <span 
                                                                key={f} 
                                                                className={cn(
                                                                    "text-[10px] px-2 py-0.5 rounded-full border",
                                                                    GLASS.textSubtle, GLASS.border
                                                                )}
                                                            >
                                                                {f}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                <div className="mb-3">
                                                    <p className={cn("font-medium text-sm italic border-l-2 pl-3", GLASS.textMuted, "border-slate-700")}>
                                                        "{displayText}{shouldTruncate && !isExpanded ? "..." : ""}"
                                                    </p>
                                                    {shouldTruncate && (
                                                        <button
                                                            onClick={() => toggleClauseExpansion(clause.id)}
                                                            className={cn(
                                                                "mt-2 text-xs flex items-center gap-1 transition-colors duration-200",
                                                                "text-blue-400 hover:text-blue-300"
                                                            )}
                                                        >
                                                            {isExpanded ? (
                                                                <>
                                                                    <ChevronUp className="h-3 w-3" />
                                                                    Show Less
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ChevronDown className="h-3 w-3" />
                                                                    Read More
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                <p className={cn("text-sm mb-3 leading-relaxed", GLASS.textMuted)}>
                                                    {clause.simplified_explanation || "No explanation available"}
                                                </p>
                                                
                                                <div className={cn(
                                                    "p-3 rounded-lg text-xs border mb-3 flex gap-2 items-start",
                                                    "bg-blue-900/20 text-blue-200 border-blue-500/10"
                                                )}>
                                                    <Shield className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
                                                    <span>
                                                        <strong className="text-blue-300">Strategy:</strong>{" "}
                                                        {clause.actionable_step}
                                                    </span>
                                                </div>
                                                
                                                {clause.severity_score >= 5 && (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        disabled={isNegotiating === clause.id}
                                                        onClick={() => handleNegotiate(clause)}
                                                        className={cn(
                                                            "w-full mt-2 transition-all duration-200",
                                                            "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20",
                                                            "hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                                        )}
                                                    >
                                                        {isNegotiating === clause.id ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Creating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Gavel className="mr-2 h-4 w-4" /> 
                                                                Contest This Clause
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                {/* Sidebar */}
                <div className={cn("space-y-6", SPACING.md)}>
                    {/* Risk Heatmap */}
                    {result?.analysis_result && (
                        <Card className={cn("p-4 md:p-6 relative overflow-hidden", GLASS.bg, GLASS.border, "border")}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg text-slate-300">Risk Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {hasClauses ? (() => {
                                    const highRisk = clauses.filter(c => c.severity_score >= 7).length;
                                    const mediumRisk = clauses.filter(c => c.severity_score >= 4 && c.severity_score < 7).length;
                                    const lowRisk = clauses.filter(c => c.severity_score < 4).length;
                                    const total = clauses.length;
                                    
                                    return (
                                        <div className={cn("space-y-4", SPACING.sm)}>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-semibold text-red-400">High Risk (7-10)</span>
                                                    <span className={cn("text-sm", GLASS.textSubtle)}>
                                                        {highRisk} clause{highRisk !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                                                        style={{ width: `${total > 0 ? (highRisk / total) * 100 : 0}%` }}
                                                        title={`${highRisk} high risk clauses`}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-semibold text-yellow-400">Medium Risk (4-6)</span>
                                                    <span className={cn("text-sm", GLASS.textSubtle)}>
                                                        {mediumRisk} clause{mediumRisk !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500"
                                                        style={{ width: `${total > 0 ? (mediumRisk / total) * 100 : 0}%` }}
                                                        title={`${mediumRisk} medium risk clauses`}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-semibold text-green-400">Low Risk (1-3)</span>
                                                    <span className={cn("text-sm", GLASS.textSubtle)}>
                                                        {lowRisk} clause{lowRisk !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                                                        style={{ width: `${total > 0 ? (lowRisk / total) * 100 : 0}%` }}
                                                        title={`${lowRisk} low risk clauses`}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="pt-3 border-t border-white/10 mt-4">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className={GLASS.textSubtle}>Total Clauses:</span>
                                                    <span className="font-bold text-white">{total}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs mt-2">
                                                    <span className={GLASS.textSubtle}>Risk Ratio:</span>
                                                    <span className={cn(
                                                        "font-bold",
                                                        highRisk > mediumRisk + lowRisk ? "text-red-400" :
                                                        mediumRisk > lowRisk ? "text-yellow-400" : "text-green-400"
                                                    )}>
                                                        {highRisk > 0 ? `${highRisk}H` : ''}{mediumRisk > 0 ? `${mediumRisk}M` : ''}{lowRisk > 0 ? `${lowRisk}L` : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })() : (
                                    <div className="text-center py-8">
                                        <p className={GLASS.textSubtle}>No risk data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                    
                    {/* Score Card */}
                    <Card className={cn("p-4 md:p-6 relative overflow-hidden", GLASS.bg, GLASS.border, "border")}>
                        <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none z-0"></div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-slate-300">Threat Level</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center relative z-10">
                            {result?.analysis_result ? (
                                <div className="relative h-40 w-40 md:h-48 md:w-48 flex items-center justify-center mb-4 md:mb-6">
                                    <svg 
                                        className="h-full w-full rotate-[-90deg] drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-1000" 
                                        viewBox="0 0 36 36"
                                    >
                                        <path 
                                            className="text-slate-800" 
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                        />
                                        <path 
                                            className={cn(
                                                "transition-all duration-1000 ease-out cap-round",
                                                getDangerColor(dangerScore)
                                            )}
                                            strokeDasharray={`${dangerScore}, 100`}
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className={cn(
                                            "text-5xl font-black tracking-tighter transition-colors duration-500",
                                            getDangerColor(dangerScore)
                                        )}>
                                            {dangerScore}
                                        </span>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mt-1">
                                            Danger Index
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-40 w-full flex items-end justify-between gap-1 opacity-30 my-4">
                                    {[40, 70, 45, 90, 60, 50, 80, 55, 95, 30].map((h, i) => (
                                    <div key={i} className="w-full bg-blue-500/20 rounded-t-sm relative group overflow-hidden">
                                        <div
                                            className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-purple-400/0 animate-pulse"
                                            style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
                                        />
                                    </div>
                                    ))}
                                </div>
                            )}

                            {result?.analysis_result?.document_summary && (
                                <div className={cn("w-full p-4 rounded-xl border", GLASS.bg, GLASS.border)}>
                                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Executive Summary</h4>
                                    <p className={cn("text-xs leading-relaxed max-h-32 overflow-y-auto custom-scrollbar", GLASS.textSubtle)}>
                                        {result.analysis_result.document_summary}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Activity - High-Fidelity Redesign */}
                    <Card className={cn(GLASS.bg, GLASS.border, "border")}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm uppercase tracking-wider text-slate-500">History</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {history.length === 0 ? (
                                <div className="p-6 text-center">
                                    <FileText className="h-8 w-8 mx-auto mb-2 text-slate-500 opacity-50" />
                                    <p className={cn("text-sm", GLASS.textSubtle)}>No analysis history yet</p>
                                    <p className={cn("text-xs mt-1", GLASS.textSubtle)}>Analyze your first contract to see it here</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {history.map((item) => {
                                        // Helper functions
                                        const getStatusFromScore = (score: number) => {
                                            if (score >= 70) return "Critical";
                                            if (score >= 40) return "Warning";
                                            return "Safe";
                                        };
                                        
                                        const getIconFromScore = (score: number) => {
                                            if (score >= 70) return ShieldAlert;
                                            if (score >= 40) return AlertCircle;
                                            return CheckCircle2;
                                        };
                                        
                                        const formatRelativeTime = (isoString: string): string => {
                                            try {
                                                const date = new Date(isoString);
                                                const now = new Date();
                                                const diffMs = now.getTime() - date.getTime();
                                                const diffMins = Math.floor(diffMs / 60000);
                                                const diffHours = Math.floor(diffMs / 3600000);
                                                const diffDays = Math.floor(diffMs / 86400000);
                                                
                                                if (diffMins < 1) return "Just now";
                                                if (diffMins < 60) return `${diffMins}m ago`;
                                                if (diffHours < 24) return `${diffHours}h ago`;
                                                if (diffDays < 7) return `${diffDays}d ago`;
                                                return date.toLocaleDateString();
                                            } catch {
                                                return "Unknown";
                                            }
                                        };
                                        
                                        const getStatusStyles = (status: string) => {
                                            switch (status) {
                                                case "Critical":
                                                    return {
                                                        bg: "bg-red-500/10",
                                                        text: "text-red-400",
                                                        border: "border-red-500/20",
                                                        glow: "bg-red-400",
                                                        iconBg: "bg-red-500/20",
                                                        iconColor: "text-red-400"
                                                    };
                                                case "Safe":
                                                    return {
                                                        bg: "bg-emerald-500/10",
                                                        text: "text-emerald-400",
                                                        border: "border-emerald-500/20",
                                                        glow: "bg-emerald-400",
                                                        iconBg: "bg-emerald-500/20",
                                                        iconColor: "text-emerald-400"
                                                    };
                                                case "Warning":
                                                    return {
                                                        bg: "bg-yellow-500/10",
                                                        text: "text-yellow-400",
                                                        border: "border-yellow-500/20",
                                                        glow: "bg-yellow-400",
                                                        iconBg: "bg-yellow-500/20",
                                                        iconColor: "text-yellow-400"
                                                    };
                                                default:
                                                    return {
                                                        bg: "bg-slate-500/10",
                                                        text: "text-slate-400",
                                                        border: "border-slate-500/20",
                                                        glow: "bg-slate-400",
                                                        iconBg: "bg-slate-500/20",
                                                        iconColor: "text-slate-400"
                                                    };
                                            }
                                        };
                                        
                                        const status = getStatusFromScore(item.overall_danger_score);
                                        const IconComponent = getIconFromScore(item.overall_danger_score);
                                        const relativeTime = formatRelativeTime(item.analyzed_at);
                                        const statusStyles = getStatusStyles(status);
                                        
                                        return (
                                            <button
                                                key={item.id}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-3 md:p-4 group transition-all duration-200",
                                                    "hover:bg-white/5 border-l-2 border-transparent hover:border-white/10",
                                                    "focus:outline-none focus:bg-white/5"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    {/* Dynamic Icon */}
                                                    <div className={cn(
                                                        "p-2 rounded-lg shrink-0 transition-all duration-200",
                                                        statusStyles.iconBg,
                                                        "group-hover:scale-110"
                                                    )}>
                                                        <IconComponent className={cn("h-4 w-4 md:h-5 md:w-5", statusStyles.iconColor)} />
                                                    </div>
                                                    
                                                    {/* Document Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm md:text-base text-slate-200 truncate group-hover:text-white transition-colors">
                                                            {item.document_title}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className={cn(
                                                                "text-xs font-mono tabular-nums",
                                                                statusStyles.text
                                                            )}>
                                                                Risk: <span className="font-bold">{item.overall_danger_score}</span>/100
                                                            </span>
                                                            {item.clause_count > 0 && (
                                                                <>
                                                                    <span className="text-[10px] text-slate-500">•</span>
                                                                    <span className="text-[10px] text-slate-500">{item.clause_count} clause{item.clause_count !== 1 ? 's' : ''}</span>
                                                                </>
                                                            )}
                                                            <span className="text-[10px] text-slate-500">•</span>
                                                            <span className="text-[10px] text-slate-500">{relativeTime}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Status Badge with Glow */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border backdrop-blur-sm transition-all duration-200",
                                                        statusStyles.bg,
                                                        statusStyles.text,
                                                        statusStyles.border,
                                                        "group-hover:shadow-lg group-hover:shadow-current/20"
                                                    )}>
                                                        <span className={cn(
                                                            "w-1.5 h-1.5 rounded-full",
                                                            statusStyles.glow,
                                                            "shadow-[0_0_4px_currentColor]"
                                                        )} />
                                                        {status}
                                                    </span>
                                                    
                                                    {/* Chevron - Slides in on hover */}
                                                    <ChevronRight className={cn(
                                                        "h-4 w-4 text-slate-400 transition-all duration-200 shrink-0",
                                                        "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                                                    )} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

