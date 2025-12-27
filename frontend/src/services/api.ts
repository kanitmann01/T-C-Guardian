import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export interface Clause {
    id: string;
    clause_text: string;
    category: string;
    simplified_explanation: string;
    severity_score: number;
    legal_context: string;
    actionable_step: string;
    flags: string[];
}

export interface AnalysisResponse {
    analysis_result: {
        document_summary: string;
        overall_danger_score: number;
        clauses: Clause[];
    };
}

export const ingestFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/ingest/file", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data; // Returns {status, text_length, preview}
};

// Jurisdiction enum values matching backend
export type Jurisdiction = "US_CALIFORNIA" | "EU_GDPR" | "INDIA_IT_ACT";

// Map legacy string format to enum format
const mapJurisdictionToEnum = (jurisdiction: string): Jurisdiction => {
    const mapping: Record<string, Jurisdiction> = {
        "US-CA": "US_CALIFORNIA",
        "US_CALIFORNIA": "US_CALIFORNIA",
        "EU-GDPR": "EU_GDPR",
        "EU_GDPR": "EU_GDPR",
        "IN": "INDIA_IT_ACT",
        "INDIA_IT_ACT": "INDIA_IT_ACT",
    };
    return mapping[jurisdiction.toUpperCase()] || "US_CALIFORNIA";
};

export const analyzeText = async (
    text: string, 
    jurisdiction: string = "US-CA"
): Promise<AnalysisResponse> => {
    const jurisdictionEnum = mapJurisdictionToEnum(jurisdiction);
    const response = await api.post("/analyze", {
        text,
        jurisdiction: jurisdictionEnum
    });
    return response.data;
};

// Negotiations
export interface Negotiation {
    id: string;
    company_name: string;
    status: string;
    clause_text: string;
    email_content?: string;
    document_title?: string;
    // Full clause context (if available)
    clause_category?: string;
    clause_severity_score?: number;
    clause_legal_context?: string;
    clause_actionable_step?: string;
    clause_simplified_explanation?: string;
    clause_flags?: string[];
}

export interface NegotiationCreateRequest {
    user_id: string;
    document_title: string;
    company_name: string;
    clause: Clause; // Full clause object with all context
}

export const createNegotiation = async (data: NegotiationCreateRequest) => {
    const response = await api.post("/negotiations/create", data);
    return response.data;
};

export const listNegotiations = async (userId: string) => {
    const response = await api.get(`/negotiations/?user_id=${userId}`);
    return response.data;
};

export const generateEmail = async (negotiationId: string, tone: string) => {
    const response = await api.post(`/negotiations/${negotiationId}/generate-email`, { negotiation_id: negotiationId, tone });
    return response.data;
};

// Chat
export interface ChatMessage {
    role: "user" | "model";
    parts: string[];
}

export const chatWithContract = async (history: ChatMessage[], question: string, context: string) => {
    const response = await api.post("/chat/", {
        history,
        current_question: question,
        document_context: context
    });
    return response.data;
};

export default api;
