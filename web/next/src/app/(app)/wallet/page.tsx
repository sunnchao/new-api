"use client";

import { use } from "react";
import { Wallet } from "@/features/wallet";

type WalletSearchParams = {
  show_history?: string | string[];
};

export default function Page({
  searchParams,
}: {
  searchParams: Promise<WalletSearchParams>;
}) {
  const search = use(searchParams);
  const showHistory = Array.isArray(search.show_history)
    ? search.show_history.at(-1)
    : search.show_history;

  return <Wallet initialShowHistory={showHistory === "true"} />;
}
