import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnalysisResponse } from '../services/api';

interface Clause {
    id: string;
    clause_text: string;
    category: string;
    simplified_explanation: string;
    severity_score: number;
    legal_context: string;
    actionable_step: string;
    flags: string[];
}

interface AnalysisState {
    // Current analysis result
    currentAnalysis: AnalysisResponse | null;
    
    // Selected clause for negotiation
    selectedClause: Clause | null;
    
    // Document metadata
    documentTitle: string | null;
    companyName: string | null;
    contractText: string | null;
    
    // Actions
    setAnalysis: (analysis: AnalysisResponse) => void;
    setSelectedClause: (clause: Clause | null) => void;
    setDocumentMetadata: (title: string | null, company: string | null, text: string | null) => void;
    clearAnalysis: () => void;
    getClauseById: (id: string) => Clause | null;
}

const initialState = {
    currentAnalysis: null,
    selectedClause: null,
    documentTitle: null,
    companyName: null,
    contractText: null,
};

export const useAnalysisStore = create<AnalysisState>()(
    persist(
        (set, get) => ({
            ...initialState,
            
            setAnalysis: (analysis: AnalysisResponse) => {
                set({ currentAnalysis: analysis });
            },
            
            setSelectedClause: (clause: Clause | null) => {
                set({ selectedClause: clause });
            },
            
            setDocumentMetadata: (title: string | null, company: string | null, text: string | null) => {
                set({
                    documentTitle: title,
                    companyName: company,
                    contractText: text,
                });
            },
            
            clearAnalysis: () => {
                set(initialState);
            },
            
            getClauseById: (id: string) => {
                const state = get();
                if (!state.currentAnalysis?.analysis_result?.clauses) {
                    return null;
                }
                return state.currentAnalysis.analysis_result.clauses.find(
                    (clause) => clause.id === id
                ) || null;
            },
        }),
        {
            name: 'tc-guardian-analysis-storage',
            // Only persist essential data to avoid localStorage size limits
            partialize: (state) => ({
                currentAnalysis: state.currentAnalysis,
                selectedClause: state.selectedClause,
                documentTitle: state.documentTitle,
                companyName: state.companyName,
                // Don't persist contractText as it can be very large
            }),
        }
    )
);
