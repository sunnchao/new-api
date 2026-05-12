"use client";

import { getPrivacyPolicy } from "./api";
import { LegalDocument } from "./legal-document";

export function PrivacyPolicyPage() {
  return (
    <LegalDocument
      titleKey="auth.privacyPolicy"
      queryKey="privacy-policy"
      fetchDocument={getPrivacyPolicy}
      emptyMessageKey="legal.privacyPolicyEmpty"
    />
  );
}
