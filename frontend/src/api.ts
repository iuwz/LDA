// src/api.ts
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const common: RequestInit = {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
};

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any).detail || res.statusText);
    }
    return res.json() as Promise<T>;
}

// ─── AUTH ────────────────────────────────────────────────────────────────
export interface LoginReq { email: string; password: string; }
export interface LoginRes { access_token: string; token_type: "bearer"; }
export function login(data: LoginReq) {
    return fetch(`${API_BASE}/auth/login`, {
        ...common,
        method: "POST",
        body: JSON.stringify(data),
    }).then(r => handleResponse<LoginRes>(r));
}

export interface RegisterReq { username: string; email: string; hashed_password: string; }
export interface RegisterRes { message: string; user: any; }
export function register(data: RegisterReq) {
    return fetch(`${API_BASE}/auth/register`, {
        ...common,
        method: "POST",
        body: JSON.stringify(data),
    }).then(r => handleResponse<RegisterRes>(r));
}

// ─── RISK ────────────────────────────────────────────────────────────────
export interface AnalyzeRiskReq { document_text: string; }
export interface AnalyzeRiskRes { analysis_result: { id: string; risks: any[] } }
export function analyzeRisk(document_text: string) {
    return fetch(`${API_BASE}/risk/analyze`, {
        ...common,
        method: "POST",
        body: JSON.stringify({ document_text }),
    }).then(r => handleResponse<AnalyzeRiskRes>(r));
}

export function listRiskReports() {
    return fetch(`${API_BASE}/risk`, { ...common, method: "GET" })
        .then(r => handleResponse<any[]>(r));
}

// ─── COMPLIANCE ─────────────────────────────────────────────────────────
export interface ComplianceRes { report_id: string; issues: any[] }
export function checkCompliance(document_text: string) {
    return fetch(`${API_BASE}/compliance/check`, {
        ...common,
        method: "POST",
        body: JSON.stringify({ document_text }),
    }).then(r => handleResponse<ComplianceRes>(r));
}

// ─── CHATBOT ────────────────────────────────────────────────────────────
export interface ChatResponse { session_id: string; bot_response: string; }
export function chat(query: string) {
    return fetch(`${API_BASE}/chatbot/query`, {
        ...common,
        method: "POST",
        body: JSON.stringify({ query }),
    }).then(r => handleResponse<ChatResponse>(r));
}

// ─── DOCUMENTS ──────────────────────────────────────────────────────────
export interface DocumentRecord { _id: string; filename: string; owner_id: string; file_id: string }
export interface UploadRes { doc_id: string; gridfs_file_id: string }
export function uploadDocument(file: File) {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${API_BASE}/documents/upload`, {
        credentials: "include",
        method: "POST",
        body: form,
    }).then(r => handleResponse<UploadRes>(r));
}
export function listDocuments() {
    return fetch(`${API_BASE}/documents`, { ...common, method: "GET" })
        .then(r => handleResponse<DocumentRecord[]>(r));
}

// ─── REPHRASE & TRANSLATE ─────────────────────────────────────────────────
export interface RephraseRes { report_id: string; rephrased_text: string }
export function rephrase(document_text: string) {
    return fetch(`${API_BASE}/rephrase`, {
        ...common,
        method: "POST",
        body: JSON.stringify({ document_text }),
    }).then(r => handleResponse<RephraseRes>(r));
}

export interface TranslateRes { report_id: string; translated_text: string }
export function translate(document_text: string, target_lang: string) {
    return fetch(`${API_BASE}/translate`, {
        ...common,
        method: "POST",
        body: JSON.stringify({ document_text, target_lang }),
    }).then(r => handleResponse<TranslateRes>(r));
}
