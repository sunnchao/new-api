"use client";

import { getUserAgreement } from "./api";
import { LegalDocument } from "./legal-document";

export function UserAgreementPage() {
  return (
    <LegalDocument
      titleKey="legal.userAgreement"
      queryKey="user-agreement"
      fetchDocument={getUserAgreement}
      emptyMessageKey="legal.userAgreementEmpty"
    />
  );
}
