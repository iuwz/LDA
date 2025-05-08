/* ──────────────────────────────────────────────────────────────
   src/api.ts  –  central API helpers
   ─ keep credentials:"include" everywhere
   ─ single JSON / text response helpers
   ─ Risk & Compliance helpers now line‑up with the new backend
──────────────────────────────────────────────────────────────── */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const common: RequestInit = {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
};

/* generic helpers ------------------------------------------------------- */
async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        try {
            const body = await res.json();
            throw new Error((body as any).detail || res.statusText);
        } catch {
            throw new Error(res.statusText);
        }
    }
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
}

async function handleTextResponse(res: Response): Promise<string> {
    if (!res.ok) {
        const body = await res.text();
        throw new Error(body || res.statusText);
    }
    return res.text();
}

/* ═══════════════════════════ AUTH ════════════════════════════ */

export interface LoginReq {
    email: string;
    password: string;
}
export interface LoginRes {
    access_token: string;
    token_type: "bearer";
}
export function login(data: LoginReq) {
    return fetch(`${API_BASE}/auth/login`, {
        ...common,
        method: "POST",
        body: JSON.stringify(data),
    }).then(r => handleResponse<LoginRes>(r));
}

export interface RegisterReq {
    username?: string;
    first_name?: string;
    last_name?: string;
    email: string;
    hashed_password: string;
}
export interface RegisterRes {
    message: string;
    user: any;
}
export function register(data: RegisterReq) {
    return fetch(`${API_BASE}/auth/register`, {
        ...common,
        method: "POST",
        body: JSON.stringify(data),
    }).then(r => handleResponse<RegisterRes>(r));
}

export function logout() {
    return fetch(`${API_BASE}/auth/logout`, {
        ...common,
        method: "POST",
    }).then(r => {
        if (!r.ok) throw new Error("Logout failed");
    });
}

/* ═══════════════════════════ RISK  ════════════════════════════ */

export interface RiskItemBackend {
    section: string;
    clause?: string;
    risk_description: string;
    severity: "Low" | "Medium" | "High";
    recommendation?: string;
}
export interface RiskAnalysisResponse {
    id: string;
    risks: RiskItemBackend[];
    /** ↓ these are added later when a PDF is uploaded */
    report_doc_id?: string | null;
    filename?: string | null;
}

/* analyse raw text */
export function analyzeRisk(document_text: string): Promise<RiskAnalysisResponse> {
    return fetch(`${API_BASE}/risk/analyze`, {
        ...common,
        method: "POST",
        body: JSON.stringify({ document_text }),
    })
        .then(r => handleResponse<{ analysis_result: RiskAnalysisResponse }>(r))
        .then(d => d.analysis_result);
}

/* analyse uploaded file */
export function analyzeRiskFile(file: File): Promise<RiskAnalysisResponse> {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${API_BASE}/risk/analyze-file`, {
        credentials: "include",
        method: "POST",
        body: form,
    })
        .then(r => handleResponse<{ analysis_result: RiskAnalysisResponse }>(r))
        .then(d => d.analysis_result);
}

/* upload jsPDF generated on the client */
export function uploadRiskPdf(reportId: string, blob: Blob, filename: string) {
    const form = new FormData();
    form.append("file", blob, filename);
    return fetch(`${API_BASE}/risk/${reportId}/upload-pdf`, {
        credentials: "include",
        method: "POST",
        body: form,
    }).then(r =>
        handleResponse<{ report_doc_id: string; filename: string }>(r),
    );
}

/* history list */
export interface RiskHistoryItem {
    id: string;
    created_at: string;
    num_risks: number;
    filename?: string | null;
    report_filename?: string | null;
    report_doc_id?: string | null;
}
export function listRiskHistory() {
    return fetch(`${API_BASE}/risk/history`, {
        ...common,
        method: "GET",
    })
        .then(r => handleResponse<{ history: RiskHistoryItem[] }>(r))
        .then(d => d.history);
}

/* fetch ONE stored risk report */
export function getRiskReport(id: string): Promise<RiskAnalysisResponse> {
    return fetch(`${API_BASE}/risk/${id}`, {
        ...common,
        method: "GET",
    })
        .then(r => handleResponse<{ risk_report: RiskAnalysisResponse }>(r))
        .then(d => d.risk_report);
}

/* delete */
export function deleteRiskReport(id: string) {
    return fetch(`${API_BASE}/risk/${id}`, {
        ...common,
        method: "DELETE",
    }).then(r => {
        if (!r.ok) throw new Error("Delete failed");
    });
}

/* PDF download helper (re‑uses generic document downloader below) */
export function downloadRiskReport(docId: string, filename: string) {
    return downloadDocumentById(docId, filename);
}

/* ═══════════════════════════ CHATBOT ══════════════════════════ */
export interface ChatMessage {
    sender: "user" | "bot";
    text: string;
    timestamp: string;
}
export interface ChatSessionSummary {
    id: string;
    title: string;
    preview: string;
    created_at: string;
    updated_at: string;
}
export interface ChatResponse {
    session_id: string;
    bot_response: string;
}

export function chat(body: { query: string; session_id?: string | null }) {
    return fetch(`${API_BASE}/chatbot`, {
        ...common,
        method: "POST",
        body: JSON.stringify(body),
    }).then(r => handleResponse<ChatResponse>(r));
}

export function listChatHistory() {
    return fetch(`${API_BASE}/chatbot/history`, { ...common, method: "GET" }).then(r =>
        handleResponse<ChatSessionSummary[]>(r),
    );
}

export function getChatSession(id: string) {
    return fetch(`${API_BASE}/chatbot/session/${id}`, { ...common, method: "GET" }).then(r =>
        handleResponse<{ messages: ChatMessage[] }>(r),
    );
}

/* ═════════════════════ DOCUMENT UPLOADS (GridFS) ══════════════ */

export interface DocumentRecord {
    _id: string;
    filename: string;
    owner_id: string;
    file_id: string;
}
export interface UploadRes {
    doc_id: string;
    gridfs_file_id: string;
}

export function uploadDocument(file: File): Promise<UploadRes> {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${API_BASE}/documents/upload`, {
        credentials: "include",
        method: "POST",
        body: form,
    }).then(r => handleResponse<UploadRes>(r));
}

export function listDocuments(): Promise<DocumentRecord[]> {
    return fetch(`${API_BASE}/documents`, {
        ...common,
        method: "GET",
    }).then(r => handleResponse<DocumentRecord[]>(r));
}

export function getDocumentContent(docId: string): Promise<string> {
    return fetch(`${API_BASE}/documents/content/${docId}`, {
        credentials: "include",
        method: "GET",
    }).then(r => handleTextResponse(r));
}

/* download helper (also for risk / compliance PDFs) */
export async function downloadDocumentById(docId: string, filename: string) {
    const headers = new Headers(common.headers);
    headers.delete("Content-Type");

    const res = await fetch(`${API_BASE}/documents/download/${docId}`, {
        ...common,
        method: "GET",
        headers,
    });
    if (!res.ok) {
        const detail = await res.text().catch(() => res.statusText);
        throw new Error(
            `Failed to download document ${filename}: ${res.status} ${detail}`,
        );
    }

    /* honour filename from Content‑Disposition if present */
    const cd = res.headers.get("Content-Disposition") || "";
    let effectiveFilename = filename;
    const m = cd.match(/filename\*?=UTF-8''(.+)$/);
    if (m && m[1]) effectiveFilename = decodeURIComponent(m[1]);
    else {
        const m2 = cd.match(/filename="(.+)"/);
        if (m2 && m2[1]) effectiveFilename = m2[1].replace(/['"]/g, "");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = effectiveFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* ═══════════════════ REPHRASE & TRANSLATE ════════════════════ */

export interface RephraseTextResponse {
    report_id: string;
    rephrased_text: string;
}
export interface RephraseDocumentResponse {
    report_id: string;
    rephrased_doc_id: string;
    rephrased_doc_filename: string;
}
export function rephrase(
    data: { document_text: string; style: string } | { doc_id: string; style: string },
) {
    const body: Record<string, any> = { style: data.style };
    if ("document_text" in data) body.document_text = data.document_text;
    else body.doc_id = data.doc_id;

    return fetch(`${API_BASE}/rephrase`, {
        ...common,
        method: "POST",
        body: JSON.stringify(body),
    }).then(r =>
        handleResponse<RephraseTextResponse | RephraseDocumentResponse>(r),
    );
}

/* translation */
export interface TranslateRes {
    report_id: string;
    translated_text: string;
}
export function translateText(document_text: string, target_lang: string) {
    return fetch(`${API_BASE}/translate`, {
        ...common,
        method: "POST",
        body: JSON.stringify({ document_text, target_lang }),
    }).then(r => handleResponse<TranslateRes>(r));
}

export function translateFile(
    file: File,
    target_lang: string,
): Promise<{ blob: Blob; filename: string }> {
    const form = new FormData();
    form.append("file", file);
    form.append("target_lang", target_lang);
    return fetch(`${API_BASE}/translate/file`, {
        credentials: "include",
        method: "POST",
        body: form,
    }).then(async res => {
        if (!res.ok) {
            const detail = await res.text().catch(() => res.statusText);
            throw new Error(detail);
        }
        const cd = res.headers.get("Content-Disposition") || "";
        let filename = "";
        const m = cd.match(/filename\*?=UTF-8''(.+)$/);
        if (m && m[1]) filename = decodeURIComponent(m[1]);
        else {
            const m2 = cd.match(/filename="(.+)"/);
            if (m2 && m2[1]) filename = m2[1];
        }
        const blob = await res.blob();
        return { blob, filename: filename || `translated_${file.name}.txt` };
    });
}

/* ═══════════════════ COMPLIANCE  ═════════════════════════════ */

export interface ComplianceIssue {
    rule_id: string;
    description: string;
    status: string;
    extracted_text_snippet?: string | null;
}
export interface ComplianceReportResponse {
    report_id: string;
    issues: ComplianceIssue[];
    report_filename?: string | null;
    report_doc_id?: string | null;
}

/* run check (text OR doc_id) */
export function checkCompliance(data: {
    document_text?: string;
    doc_id?: string;
}): Promise<ComplianceReportResponse> {
    const body: Record<string, any> = {};
    if (data.document_text) body.document_text = data.document_text;
    else if (data.doc_id) body.doc_id = data.doc_id;
    else return Promise.reject(new Error("Provide document_text or doc_id"));

    return fetch(`${API_BASE}/compliance/check`, {
        ...common,
        method: "POST",
        body: JSON.stringify(body),
    }).then(r => handleResponse<ComplianceReportResponse>(r));
}

/* download ready‑made reports (backend streams PDF/DOCX) */
export function downloadComplianceReportPdf(reportId: string) {
    const url = `${API_BASE}/compliance/report/pdf/${reportId}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance_report_${reportId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/* history */
export interface ComplianceHistoryItem {
    id: string;
    created_at: string;
    num_issues: number;
    report_filename?: string | null;
    report_doc_id?: string | null;
}
export function listComplianceHistory() {
    return fetch(`${API_BASE}/compliance/history`, {
        ...common,
        method: "GET",
    })
        .then(r => handleResponse<{ history: ComplianceHistoryItem[] }>(r))
        .then(d => d.history);
}

/* delete stored report */
export function deleteComplianceReport(id: string) {
    return fetch(`${API_BASE}/compliance/${id}`, {
        ...common,
        method: "DELETE",
    }).then(r => {
        if (!r.ok) throw new Error("Delete failed");
    });
}

/* fetch ONE stored compliance report */
export function getComplianceReport(id: string): Promise<ComplianceReportResponse> {
    return fetch(`${API_BASE}/compliance/${id}`, {
        ...common,
        method: "GET",
    })
        .then(r => handleResponse<{ compliance_report: ComplianceReportResponse }>(r))
        .then(d => d.compliance_report);
}

/* ═══════════════════ REPHRASE HISTORY  ═══════════════════════ */

export interface RephraseHistoryItem {
    id: string;
    style: string;
    created_at: string;
    type: "text" | "doc";
    filename?: string;
    result_doc_id?: string;
    result_text?: string;
}

export function listRephraseHistory() {
    return fetch(`${API_BASE}/rephrase/history`, {
        ...common,
        method: "GET",
    })
        .then(r => handleResponse<{ history: RephraseHistoryItem[] }>(r))
        .then(d => d.history);
}

export function deleteRephraseReport(id: string) {
    return fetch(`${API_BASE}/rephrase/${id}`, {
        ...common,
        method: "DELETE",
    }).then(r => {
        if (!r.ok) throw new Error("Delete failed");
    });
}
/* ═════════ TRANSLATION HISTORY ════════ */
export interface TranslationHistoryItem {
    id: string;
    created_at: string;
    target_lang: string;
    type: "text" | "doc";
    translated_filename?: string | null;
    result_doc_id?: string | null;
}

export function listTranslationHistory() {
    return fetch(`${API_BASE}/translate/history`, { ...common, method: "GET" })
        .then(r => handleResponse<{ history: TranslationHistoryItem[] }>(r))
        .then(d => d.history);
}

export function deleteTranslationReport(id: string) {
    return fetch(`${API_BASE}/translate/${id}`, { ...common, method: "DELETE" })
        .then(r => { if (!r.ok) throw new Error("Delete failed"); });
}

export function getTranslationReport(id: string) {
    return fetch(`${API_BASE}/translate/${id}`, { ...common, method: "GET" })
        .then(r => handleResponse<{ translation_report: any }>(r))
        .then(d => d.translation_report);
}
export function forgotPassword(email: string) {
    return fetch(`${API_BASE}/auth/forgot-password`, {
        ...common,
        method: "POST",
        body: JSON.stringify({ email }),
    }).then(r => handleResponse<{ message: string }>(r));
}

export function resetPassword(token: string, new_password: string) {
    return fetch(`${API_BASE}/auth/reset-password`, {
        ...common,
        method: "POST",
        body: JSON.stringify({ token, new_password }),
    }).then(r => handleResponse<{ message: string }>(r));
}
