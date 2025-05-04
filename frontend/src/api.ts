const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const common: RequestInit = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

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

export interface RegisterReq {
  username?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  hashed_password: string;
}
export interface RegisterRes { message: string; user: any; }
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

// ─── RISK (text) ─────────────────────────────────────────────────────────
export interface AnalyzeRiskRes { analysis_result: { id: string; risks: any[] } }
export function analyzeRisk(document_text: string) {
  return fetch(`${API_BASE}/risk/analyze`, {
    ...common,
    method: "POST",
    body: JSON.stringify({ document_text }),
  }).then(r => handleResponse<AnalyzeRiskRes>(r));
}

// ─── RISK (file) ─────────────────────────────────────────────────────────
export interface RiskItemBackend {
  section: string;
  clause?: string;
  risk_description: string;
  severity: "Low" | "Medium" | "High";
  recommendation?: string;
}
export interface RiskAnalysisResponse { id: string; risks: RiskItemBackend[]; }
export function analyzeRiskFile(file: File): Promise<RiskAnalysisResponse> {
  const form = new FormData();
  form.append("file", file);
  return fetch(`${API_BASE}/risk/analyze-file`, {
    credentials: "include",
    method: "POST",
    body: form,
  })
    .then(r => handleResponse<{ analysis_result: { id: string; risks: RiskItemBackend[] } }>(r))
    .then(data => ({ id: data.analysis_result.id, risks: data.analysis_result.risks }));
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
  return fetch(`${API_BASE}/documents`, { ...common, method: "GET" })
    .then(r => handleResponse<DocumentRecord[]>(r));
}
export function getDocumentContent(docId: string): Promise<string> {
  return fetch(`${API_BASE}/documents/content/${docId}`, {
    credentials: "include",
    method: "GET",
  }).then(r => handleTextResponse(r));
}
export async function downloadDocumentById(docId: string, filename: string): Promise<void> {
  const headers = new Headers(common.headers);
  headers.delete("Content-Type");
  const res = await fetch(`${API_BASE}/documents/download/${docId}`, {
    ...common,
    method: "GET",
    headers,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`Failed to download document ${filename}: ${res.status} ${detail}`);
  }
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

// ─── REPHRASE & TRANSLATE ─────────────────────────────────────────────────
export interface RephraseTextResponse { report_id: string; rephrased_text: string; }
export interface RephraseDocumentResponse { report_id: string; rephrased_doc_id: string; rephrased_doc_filename: string; }
export function rephrase(data: { document_text: string; style: string } | { doc_id: string; style: string }) {
  const body: any = { style: data.style };
  if ("document_text" in data && data.document_text) body.document_text = data.document_text;
  else if ("doc_id" in data && data.doc_id) body.doc_id = data.doc_id;
  else return Promise.reject(new Error("Provide document_text or doc_id"));
  return fetch(`${API_BASE}/rephrase`, {
    ...common,
    method: "POST",
    body: JSON.stringify(body),
  }).then(r => handleResponse<RephraseTextResponse | RephraseDocumentResponse>(r));
}

export interface TranslateRes { report_id: string; translated_text: string; }
export function translateText(document_text: string, target_lang: string): Promise<TranslateRes> {
  return fetch(`${API_BASE}/translate`, {
    ...common,
    method: "POST",
    body: JSON.stringify({ document_text, target_lang }),
  }).then(r => handleResponse<TranslateRes>(r));
}

export function translateFile(file: File, target_lang: string): Promise<{ blob: Blob; filename: string }> {
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

// ─── COMPLIANCE ─────────────────────────────────────────────────────────
export interface ComplianceIssue { rule_id: string; description: string; status: string; extracted_text_snippet?: string | null; }
export interface ComplianceReportResponse { report_id: string; issues: ComplianceIssue[]; }
export function checkCompliance(data: { document_text?: string; doc_id?: string }): Promise<ComplianceReportResponse> {
  const body: any = {};
  if (data.document_text) body.document_text = data.document_text;
  else if (data.doc_id) body.doc_id = data.doc_id;
  else return Promise.reject(new Error("Provide document_text or doc_id"));
  return fetch(`${API_BASE}/compliance/check`, {
    ...common,
    method: "POST",
    body: JSON.stringify(body),
  }).then(r => handleResponse<ComplianceReportResponse>(r));
}

export async function downloadComplianceReport(reportId: string): Promise<void> {
  const headers = new Headers(common.headers);
  headers.delete("Content-Type");
  const res = await fetch(`${API_BASE}/compliance/report/download/${reportId}`, {
    ...common,
    method: "GET",
    headers,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`DOCX download failed: ${res.status} ${detail}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `compliance_report_${reportId}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadComplianceReportPdf(reportId: string): void {
  const url = `${API_BASE}/compliance/report/pdf/${reportId}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = `compliance_report_${reportId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
