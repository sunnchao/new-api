export function formatBytes(bytes?: number | null, decimals = 2): string {
  if (!bytes || Number.isNaN(bytes)) return "0 Bytes";
  if (bytes < 0) return `-${formatBytes(Math.abs(bytes), decimals)}`;

  const unit = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(unit)),
    sizes.length - 1,
  );

  return `${Number.parseFloat((bytes / unit ** index).toFixed(decimals))} ${
    sizes[index]
  }`;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function emptyProvider() {
  return {
    id: 0,
    name: "",
    slug: "",
    icon: "",
    enabled: true,
    client_id: "",
    client_secret: "",
    authorization_endpoint: "",
    token_endpoint: "",
    user_info_endpoint: "",
    scopes: "openid profile email",
    user_id_field: "sub",
    username_field: "preferred_username",
    display_name_field: "name",
    email_field: "email",
    well_known: "",
    auth_style: 0,
    access_policy: "",
    access_denied_message: "",
  };
}

export function slugifyProviderName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
