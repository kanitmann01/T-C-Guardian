import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AnalysisHistoryItem {
    id: string;
    document_title: string;
    company_name: string;
    overall_danger_score: number;
    clause_count: number;
    analyzed_at: string; // ISO string
    jurisdiction?: string;
}

interface HistoryState {
    scans: AnalysisHistoryItem[];
    addScan: (scan: AnalysisHistoryItem) => void;
    clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
    persist(
        (set) => ({
            scans: [],
            
            addScan: (scan) => set((state) => ({ 
                // Add new scan to the TOP of the list
                scans: [scan, ...state.scans] 
            })),

            clearHistory: () => set({ scans: [] }),
        }),
        {
            name: 'guardian-session-storage', // key in browser storage
            // 👇 THIS IS THE MAGIC PART
            // storage: createJSONStorage(() => localStorage)  <-- WOULD KEEP DATA FOREVER
            storage: createJSONStorage(() => sessionStorage), // <-- WIPES ON TAB CLOSE
        }
    )
);


