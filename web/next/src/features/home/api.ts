import { api } from "@/lib/api";
import type { HomePageContentResponse } from "./types";

export async function getHomePageContent(): Promise<HomePageContentResponse> {
  const res = await api.get("/api/home_page_content");
  return res.data as HomePageContentResponse;
}
