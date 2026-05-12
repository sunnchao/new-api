export function sendToFluent(apiKey: string, serverAddress?: string): boolean {
  if (typeof window === "undefined") return false;

  const container = document.getElementById("fluent-new-api-container");
  if (!container) return false;

  container.dispatchEvent(
    new CustomEvent("fluent:prefill", {
      detail: {
        id: "new-api",
        baseUrl: serverAddress || window.location.origin,
        apiKey: `sk-${apiKey}`,
      },
    }),
  );

  return true;
}
