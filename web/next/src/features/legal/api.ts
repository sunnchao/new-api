import { api } from "@/lib/api";
import type { LegalDocumentResponse } from "./types";

export async function getPrivacyPolicy(): Promise<LegalDocumentResponse> {
  const res = await api.get("/api/privacy-policy");
  return res.data as LegalDocumentResponse;
}

export async function getUserAgreement(): Promise<LegalDocumentResponse> {
  const res = await api.get("/api/user-agreement");
  return res.data as LegalDocumentResponse;
}
