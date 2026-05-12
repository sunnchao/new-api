import { api } from "@/lib/api";
import type { AboutResponse } from "./types";

export async function getAboutContent(): Promise<AboutResponse> {
  const res = await api.get("/api/about");
  return res.data as AboutResponse;
}
