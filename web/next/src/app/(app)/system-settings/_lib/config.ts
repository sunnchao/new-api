import type { LucideIcon } from "lucide-react";
import {
  Globe,
  ShieldCheck,
  CreditCard,
  FileText,
  Cpu,
  Wrench,
  Lock,
} from "lucide-react";

export type FieldType = "text" | "textarea" | "bool" | "number" | "select";

export interface OptionField {
  key: string;
  label?: string;
  description?: string;
  type?: FieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
}

export interface SectionDef {
  id: string;
  title: string;
  description: string;
  fields: OptionField[];
  note?: string;
}

export interface CategoryDef {
  id: string;
  label: string;
  icon: LucideIcon;
  defaultSection: string;
  sections: SectionDef[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: "site",
    label: "Site",
    icon: Globe,
    defaultSection: "branding",
    sections: [
      {
        id: "branding",
        title: "Branding",
        description: "System name, logo and footer branding",
        fields: [],
      },
      {
        id: "home",
        title: "Home Page",
        description: "Configure landing page content and server address",
        fields: [
          { key: "HomePageContent", label: "Home Page Content", type: "textarea", rows: 10 },
          { key: "About", label: "About Content", type: "textarea", rows: 8 },
          { key: "ServerAddress", label: "Server Address" },
        ],
      },
      {
        id: "footer",
        title: "Footer",
        description: "Footer HTML content",
        fields: [
          { key: "Footer", label: "Footer HTML", type: "textarea", rows: 8 },
        ],
      },
      {
        id: "legal",
        title: "Legal",
        description: "User agreement and privacy policy URLs",
        fields: [
          { key: "legal.user_agreement", label: "User Agreement URL" },
          { key: "legal.privacy_policy", label: "Privacy Policy URL" },
        ],
      },
      {
        id: "notice",
        title: "System Notice",
        description: "Global maintenance notice shown to all users",
        fields: [
          { key: "Notice", label: "Notice", type: "textarea", rows: 6 },
        ],
      },
      {
        id: "header-nav",
        title: "Header Navigation",
        description: "Header navigation modules (JSON)",
        fields: [
          { key: "HeaderNavModules", label: "HeaderNavModules", type: "textarea", rows: 12 },
        ],
      },
      {
        id: "sidebar-modules",
        title: "Sidebar Modules",
        description: "Admin sidebar module configuration (JSON)",
        fields: [
          { key: "SidebarModulesAdmin", label: "SidebarModulesAdmin", type: "textarea", rows: 12 },
        ],
      },
    ],
  },
  {
    id: "auth",
    label: "Authentication",
    icon: ShieldCheck,
    defaultSection: "basic-auth",
    sections: [
      {
        id: "basic-auth",
        title: "Basic Authentication",
        description: "Password login, registration and email verification",
        fields: [
          { key: "PasswordLoginEnabled", type: "bool", label: "Password Login Enabled" },
          { key: "PasswordRegisterEnabled", type: "bool", label: "Password Register Enabled" },
          { key: "RegisterEnabled", type: "bool", label: "Registration Enabled" },
          { key: "EmailVerificationEnabled", type: "bool", label: "Email Verification Enabled" },
          { key: "EmailDomainRestrictionEnabled", type: "bool", label: "Email Domain Restriction Enabled" },
          { key: "EmailAliasRestrictionEnabled", type: "bool", label: "Email Alias Restriction Enabled" },
          { key: "EmailDomainWhitelist", label: "Email Domain Whitelist", type: "textarea", rows: 4 },
        ],
      },
      {
        id: "oauth",
        title: "OAuth Integrations",
        description: "Third-party authentication providers",
        fields: [
          { key: "GitHubOAuthEnabled", type: "bool", label: "GitHub OAuth Enabled" },
          { key: "GitHubClientId", label: "GitHub Client ID" },
          { key: "GitHubClientSecret", label: "GitHub Client Secret" },
          { key: "discord.enabled", type: "bool", label: "Discord Enabled" },
          { key: "discord.client_id", label: "Discord Client ID" },
          { key: "discord.client_secret", label: "Discord Client Secret" },
          { key: "oidc.enabled", type: "bool", label: "OIDC Enabled" },
          { key: "oidc.client_id", label: "OIDC Client ID" },
          { key: "oidc.client_secret", label: "OIDC Client Secret" },
          { key: "oidc.well_known", label: "OIDC Well-Known URL" },
          { key: "oidc.authorization_endpoint", label: "OIDC Authorization Endpoint" },
          { key: "oidc.token_endpoint", label: "OIDC Token Endpoint" },
          { key: "oidc.user_info_endpoint", label: "OIDC User Info Endpoint" },
          { key: "TelegramOAuthEnabled", type: "bool", label: "Telegram OAuth Enabled" },
          { key: "TelegramBotToken", label: "Telegram Bot Token" },
          { key: "TelegramBotName", label: "Telegram Bot Name" },
          { key: "LinuxDOOAuthEnabled", type: "bool", label: "LinuxDO OAuth Enabled" },
          { key: "LinuxDOClientId", label: "LinuxDO Client ID" },
          { key: "LinuxDOClientSecret", label: "LinuxDO Client Secret" },
          { key: "WeChatAuthEnabled", type: "bool", label: "WeChat Auth Enabled" },
          { key: "WeChatServerAddress", label: "WeChat Server Address" },
          { key: "WeChatServerToken", label: "WeChat Server Token" },
          { key: "WeChatAccountQRCodeImageURL", label: "WeChat QR Code URL" },
        ],
      },
      {
        id: "passkey",
        title: "Passkey (WebAuthn)",
        description: "Passkey authentication configuration",
        fields: [
          { key: "passkey.enabled", type: "bool", label: "Passkey Enabled" },
          { key: "passkey.rp_display_name", label: "RP Display Name" },
          { key: "passkey.rp_id", label: "RP ID" },
          { key: "passkey.origins", label: "Allowed Origins", type: "textarea", rows: 3 },
          { key: "passkey.allow_insecure_origin", type: "bool", label: "Allow Insecure Origin" },
          {
            key: "passkey.user_verification",
            type: "select",
            label: "User Verification",
            options: [
              { value: "required", label: "Required" },
              { value: "preferred", label: "Preferred" },
              { value: "discouraged", label: "Discouraged" },
            ],
          },
          {
            key: "passkey.attachment_preference",
            type: "select",
            label: "Attachment Preference",
            options: [
              { value: "none", label: "None" },
              { value: "platform", label: "Platform" },
              { value: "cross-platform", label: "Cross-platform" },
            ],
          },
        ],
      },
      {
        id: "bot-protection",
        title: "Bot Protection",
        description: "Cloudflare Turnstile protection for login/register",
        fields: [
          { key: "TurnstileCheckEnabled", type: "bool", label: "Turnstile Enabled" },
          { key: "TurnstileSiteKey", label: "Turnstile Site Key" },
          { key: "TurnstileSecretKey", label: "Turnstile Secret Key" },
        ],
      },
      {
        id: "custom-oauth",
        title: "Custom OAuth",
        description: "Custom OAuth provider configuration (JSON)",
        fields: [
          { key: "custom_oauth.providers", label: "Custom OAuth Providers", type: "textarea", rows: 14 },
        ],
        note: "Custom OAuth providers are defined as a JSON array. Configure each provider's client_id, client_secret, and endpoints.",
      },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    icon: CreditCard,
    defaultSection: "quota",
    sections: [
      {
        id: "quota",
        title: "Quota",
        description: "New user quota, pre-consumption and invitation rewards",
        fields: [
          { key: "QuotaForNewUser", type: "number", label: "Quota for New User" },
          { key: "PreConsumedQuota", type: "number", label: "Pre-consumed Quota" },
          { key: "QuotaForInviter", type: "number", label: "Quota for Inviter" },
          { key: "QuotaForInvitee", type: "number", label: "Quota for Invitee" },
          { key: "TopUpLink", label: "Top-up Link" },
          { key: "general_setting.docs_link", label: "Docs Link" },
          { key: "quota_setting.enable_free_model_pre_consume", type: "bool", label: "Enable Free Model Pre-consume" },
        ],
      },
      {
        id: "currency",
        title: "Currency & Display",
        description: "Currency conversion and quota display",
        fields: [
          { key: "QuotaPerUnit", type: "number", label: "Quota per Unit" },
          { key: "USDExchangeRate", type: "number", label: "USD Exchange Rate" },
          { key: "DisplayInCurrencyEnabled", type: "bool", label: "Display in Currency" },
          { key: "DisplayTokenStatEnabled", type: "bool", label: "Display Token Stat" },
          {
            key: "general_setting.quota_display_type",
            type: "select",
            label: "Quota Display Type",
            options: [
              { value: "USD", label: "USD" },
              { value: "CNY", label: "CNY" },
              { value: "TOKENS", label: "Tokens" },
              { value: "CUSTOM", label: "Custom" },
            ],
          },
          { key: "general_setting.custom_currency_symbol", label: "Custom Currency Symbol" },
          { key: "general_setting.custom_currency_exchange_rate", type: "number", label: "Custom Currency Exchange Rate" },
        ],
      },
      {
        id: "model-pricing",
        title: "Model Pricing",
        description: "Visual editor for model pricing ratios",
        fields: [],
        note: undefined,
      },
      {
        id: "group-pricing",
        title: "Group Pricing",
        description: "Visual editor for group pricing ratios",
        fields: [],
        note: undefined,
      },
      {
        id: "payment-gateway",
        title: "Payment Gateway",
        description: "Payment gateway integrations (Epay, Stripe, Creem, Waffo)",
        fields: [
          { key: "PayAddress", label: "Pay Address" },
          { key: "EpayId", label: "Epay Merchant ID" },
          { key: "EpayKey", label: "Epay Key" },
          { key: "Price", type: "number", label: "Price" },
          { key: "MinTopUp", type: "number", label: "Min Top-up" },
          { key: "CustomCallbackAddress", label: "Custom Callback Address" },
          { key: "PayMethods", label: "Pay Methods (JSON)", type: "textarea", rows: 4 },
          { key: "payment_setting.amount_options", label: "Amount Options (JSON)", type: "textarea", rows: 4 },
          { key: "payment_setting.amount_discount", label: "Amount Discount (JSON)", type: "textarea", rows: 4 },
          { key: "StripeApiSecret", label: "Stripe API Secret" },
          { key: "StripeWebhookSecret", label: "Stripe Webhook Secret" },
          { key: "StripePriceId", label: "Stripe Price ID" },
          { key: "StripeUnitPrice", type: "number", label: "Stripe Unit Price" },
          { key: "StripeMinTopUp", type: "number", label: "Stripe Min Top-up" },
          { key: "StripePromotionCodesEnabled", type: "bool", label: "Stripe Promotion Codes Enabled" },
          { key: "CreemApiKey", label: "Creem API Key" },
          { key: "CreemWebhookSecret", label: "Creem Webhook Secret" },
          { key: "CreemTestMode", type: "bool", label: "Creem Test Mode" },
          { key: "CreemProducts", label: "Creem Products (JSON)", type: "textarea", rows: 6 },
        ],
      },
      {
        id: "check-in",
        title: "Check-in Rewards",
        description: "Daily check-in reward configuration",
        fields: [
          { key: "checkin_setting.enabled", type: "bool", label: "Check-in Enabled" },
          { key: "checkin_setting.min_quota", type: "number", label: "Minimum Quota" },
          { key: "checkin_setting.max_quota", type: "number", label: "Maximum Quota" },
        ],
      },
    ],
  },
  {
    id: "content",
    label: "Content",
    icon: FileText,
    defaultSection: "dashboard",
    sections: [
      {
        id: "dashboard",
        title: "Data Dashboard",
        description: "Data export for admin dashboard",
        fields: [
          { key: "DataExportEnabled", type: "bool", label: "Data Export Enabled" },
          { key: "DataExportInterval", type: "number", label: "Data Export Interval (minutes)" },
          {
            key: "DataExportDefaultTime",
            type: "select",
            label: "Default Time Granularity",
            options: [
              { value: "hour", label: "Hour" },
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
            ],
          },
        ],
      },
      {
        id: "announcement",
        title: "Announcements",
        description: "Console announcements shown to users",
        fields: [
          { key: "console_setting.announcements_enabled", type: "bool", label: "Announcements Enabled" },
          { key: "console_setting.announcements", label: "Announcements (JSON)", type: "textarea", rows: 10 },
        ],
      },
      {
        id: "api-info",
        title: "API Info",
        description: "Public API endpoint information",
        fields: [
          { key: "console_setting.api_info_enabled", type: "bool", label: "API Info Enabled" },
          { key: "console_setting.api_info", label: "API Info (JSON)", type: "textarea", rows: 10 },
        ],
      },
      {
        id: "faq",
        title: "FAQ",
        description: "Frequently asked questions",
        fields: [
          { key: "console_setting.faq_enabled", type: "bool", label: "FAQ Enabled" },
          { key: "console_setting.faq", label: "FAQ (JSON)", type: "textarea", rows: 12 },
        ],
      },
      {
        id: "uptime-kuma",
        title: "Uptime Kuma",
        description: "Uptime Kuma monitoring integration",
        fields: [
          { key: "console_setting.uptime_kuma_enabled", type: "bool", label: "Uptime Kuma Enabled" },
          { key: "console_setting.uptime_kuma_groups", label: "Uptime Kuma Groups (JSON)", type: "textarea", rows: 10 },
        ],
      },
      {
        id: "chat-presets",
        title: "Chat Presets",
        description: "Preset chat endpoints shown in chat launcher",
        fields: [
          { key: "Chats", label: "Chats (JSON)", type: "textarea", rows: 12 },
        ],
      },
      {
        id: "drawing",
        title: "Drawing",
        description: "Drawing and Midjourney settings",
        fields: [
          { key: "DrawingEnabled", type: "bool", label: "Drawing Enabled" },
          { key: "MjNotifyEnabled", type: "bool", label: "Midjourney Notify Enabled" },
          { key: "MjAccountFilterEnabled", type: "bool", label: "MJ Account Filter Enabled" },
          { key: "MjForwardUrlEnabled", type: "bool", label: "MJ Forward URL Enabled" },
          { key: "MjModeClearEnabled", type: "bool", label: "MJ Mode Clear Enabled" },
          { key: "MjActionCheckSuccessEnabled", type: "bool", label: "MJ Action Check Success Enabled" },
        ],
      },
    ],
  },
  {
    id: "models",
    label: "Models",
    icon: Cpu,
    defaultSection: "global",
    sections: [
      {
        id: "global",
        title: "Global",
        description: "Global model configuration",
        fields: [
          { key: "global.pass_through_request_enabled", type: "bool", label: "Pass-through Request Enabled" },
          { key: "global.thinking_model_blacklist", label: "Thinking Model Blacklist (JSON)", type: "textarea", rows: 6 },
          { key: "global.chat_completions_to_responses_policy", label: "Chat→Responses Policy (JSON)", type: "textarea", rows: 8 },
          { key: "general_setting.ping_interval_enabled", type: "bool", label: "Ping Interval Enabled" },
          { key: "general_setting.ping_interval_seconds", type: "number", label: "Ping Interval (seconds)" },
        ],
      },
      {
        id: "gemini",
        title: "Gemini",
        description: "Gemini model-specific settings",
        fields: [
          { key: "gemini.safety_settings", label: "Safety Settings (JSON)", type: "textarea", rows: 8 },
          { key: "gemini.version_settings", label: "Version Settings (JSON)", type: "textarea", rows: 6 },
          { key: "gemini.supported_imagine_models", label: "Supported Imagine Models (JSON)", type: "textarea", rows: 4 },
          { key: "gemini.thinking_adapter_enabled", type: "bool", label: "Thinking Adapter Enabled" },
          { key: "gemini.thinking_adapter_budget_tokens_percentage", type: "number", label: "Thinking Budget Token %" },
          { key: "gemini.function_call_thought_signature_enabled", type: "bool", label: "Function Call Thought Signature Enabled" },
          { key: "gemini.remove_function_response_id_enabled", type: "bool", label: "Remove Function Response ID Enabled" },
        ],
      },
      {
        id: "claude",
        title: "Claude",
        description: "Claude model-specific settings",
        fields: [
          { key: "claude.model_headers_settings", label: "Model Headers (JSON)", type: "textarea", rows: 8 },
          { key: "claude.default_max_tokens", type: "number", label: "Default Max Tokens" },
          { key: "claude.thinking_adapter_enabled", type: "bool", label: "Thinking Adapter Enabled" },
          { key: "claude.thinking_adapter_budget_tokens_percentage", type: "number", label: "Thinking Budget Token %" },
        ],
      },
      {
        id: "grok",
        title: "Grok",
        description: "xAI Grok model settings",
        fields: [
          { key: "grok.violation_deduction_enabled", type: "bool", label: "Violation Deduction Enabled" },
          { key: "grok.violation_deduction_amount", type: "number", label: "Violation Deduction Amount" },
        ],
      },
      {
        id: "channel-affinity",
        title: "Channel Affinity",
        description: "Sticky routing rules for channels",
        fields: [
          { key: "channel_affinity_setting.enabled", type: "bool", label: "Channel Affinity Enabled" },
          { key: "channel_affinity_setting.switch_on_success", type: "bool", label: "Switch on Success" },
          { key: "channel_affinity_setting.max_entries", type: "number", label: "Max Entries" },
          { key: "channel_affinity_setting.default_ttl_seconds", type: "number", label: "Default TTL (seconds)" },
          { key: "channel_affinity_setting.rules", label: "Rules (JSON)", type: "textarea", rows: 10 },
        ],
      },
      {
        id: "deployment",
        title: "Deployment",
        description: "Model deployment provider (io.net)",
        fields: [
          { key: "model_deployment.ionet.enabled", type: "bool", label: "io.net Deployment Enabled" },
          { key: "model_deployment.ionet.api_key", label: "io.net API Key" },
        ],
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: Wrench,
    defaultSection: "behavior",
    sections: [
      {
        id: "behavior",
        title: "System Behavior",
        description: "System-wide behavior and defaults",
        fields: [
          { key: "RetryTimes", type: "number", label: "Retry Times" },
          { key: "DefaultCollapseSidebar", type: "bool", label: "Default Collapse Sidebar" },
          { key: "DemoSiteEnabled", type: "bool", label: "Demo Site Enabled" },
          { key: "SelfUseModeEnabled", type: "bool", label: "Self-use Mode Enabled" },
        ],
      },
      {
        id: "monitoring",
        title: "Monitoring & Alerts",
        description: "Channel monitoring and automation",
        fields: [
          { key: "ChannelDisableThreshold", type: "number", label: "Channel Disable Threshold" },
          { key: "QuotaRemindThreshold", type: "number", label: "Quota Remind Threshold" },
          { key: "AutomaticDisableChannelEnabled", type: "bool", label: "Auto-disable Channel Enabled" },
          { key: "AutomaticEnableChannelEnabled", type: "bool", label: "Auto-enable Channel Enabled" },
          { key: "AutomaticDisableKeywords", label: "Auto-disable Keywords", type: "textarea", rows: 3 },
          { key: "AutomaticDisableStatusCodes", label: "Auto-disable Status Codes", type: "textarea", rows: 3 },
          { key: "AutomaticRetryStatusCodes", label: "Auto-retry Status Codes", type: "textarea", rows: 3 },
          { key: "monitor_setting.auto_test_channel_enabled", type: "bool", label: "Auto-test Channel Enabled" },
          { key: "monitor_setting.auto_test_channel_minutes", type: "number", label: "Auto-test Interval (minutes)" },
        ],
      },
      {
        id: "smtp",
        title: "SMTP Email",
        description: "Outbound SMTP email configuration",
        fields: [
          { key: "SMTPServer", label: "SMTP Server" },
          { key: "SMTPPort", type: "number", label: "SMTP Port" },
          { key: "SMTPAccount", label: "SMTP Account" },
          { key: "SMTPFrom", label: "SMTP From" },
          { key: "SMTPToken", label: "SMTP Token" },
          { key: "SMTPSSLEnabled", type: "bool", label: "SMTP SSL Enabled" },
          { key: "SMTPForceAuthLogin", type: "bool", label: "SMTP Force Auth Login" },
        ],
      },
      {
        id: "worker-proxy",
        title: "Worker Proxy",
        description: "Worker proxy service configuration",
        fields: [
          { key: "WorkerUrl", label: "Worker URL" },
          { key: "WorkerValidKey", label: "Worker Valid Key" },
          { key: "WorkerAllowHttpImageRequestEnabled", type: "bool", label: "Allow HTTP Image Request" },
        ],
      },
      {
        id: "log-maintenance",
        title: "Log Maintenance",
        description: "Log consumption and retention",
        fields: [
          { key: "LogConsumeEnabled", type: "bool", label: "Log Consume Enabled" },
        ],
      },
      {
        id: "performance",
        title: "Performance",
        description: "Disk cache, system monitoring and performance metrics",
        fields: [
          { key: "performance_setting.disk_cache_enabled", type: "bool", label: "Disk Cache Enabled" },
          { key: "performance_setting.disk_cache_threshold_mb", type: "number", label: "Disk Cache Threshold (MB)" },
          { key: "performance_setting.disk_cache_max_size_mb", type: "number", label: "Disk Cache Max Size (MB)" },
          { key: "performance_setting.disk_cache_path", label: "Disk Cache Path" },
          { key: "performance_setting.monitor_enabled", type: "bool", label: "System Monitor Enabled" },
          { key: "performance_setting.monitor_cpu_threshold", type: "number", label: "CPU Threshold %" },
          { key: "performance_setting.monitor_memory_threshold", type: "number", label: "Memory Threshold %" },
          { key: "performance_setting.monitor_disk_threshold", type: "number", label: "Disk Threshold %" },
          { key: "perf_metrics_setting.enabled", type: "bool", label: "Perf Metrics Enabled" },
          { key: "perf_metrics_setting.flush_interval", type: "number", label: "Flush Interval (seconds)" },
          {
            key: "perf_metrics_setting.bucket_time",
            type: "select",
            label: "Bucket Time",
            options: [
              { value: "minute", label: "Minute" },
              { value: "hour", label: "Hour" },
              { value: "day", label: "Day" },
            ],
          },
          { key: "perf_metrics_setting.retention_days", type: "number", label: "Retention Days (0 = forever)" },
        ],
      },
      {
        id: "update-checker",
        title: "Update Checker",
        description: "Check for system updates",
        fields: [],
        note: "Use the system maintenance console to check for new releases. No editable options here.",
      },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: Lock,
    defaultSection: "rate-limit",
    sections: [
      {
        id: "rate-limit",
        title: "Rate Limiting",
        description: "Model request rate limiting",
        fields: [
          { key: "ModelRequestRateLimitEnabled", type: "bool", label: "Rate Limit Enabled" },
          { key: "ModelRequestRateLimitCount", type: "number", label: "Request Count" },
          { key: "ModelRequestRateLimitSuccessCount", type: "number", label: "Success Count" },
          { key: "ModelRequestRateLimitDurationMinutes", type: "number", label: "Duration (minutes)" },
          { key: "ModelRequestRateLimitGroup", label: "Group Rule (JSON)", type: "textarea", rows: 6 },
        ],
      },
      {
        id: "sensitive-words",
        title: "Sensitive Words",
        description: "Sensitive word filtering",
        fields: [
          { key: "CheckSensitiveEnabled", type: "bool", label: "Check Sensitive Enabled" },
          { key: "CheckSensitiveOnPromptEnabled", type: "bool", label: "Check on Prompt" },
          { key: "SensitiveWords", label: "Sensitive Words", type: "textarea", rows: 10 },
        ],
      },
      {
        id: "ssrf",
        title: "SSRF Protection",
        description: "Server-side request forgery protection",
        fields: [
          { key: "fetch_setting.enable_ssrf_protection", type: "bool", label: "SSRF Protection Enabled" },
          { key: "fetch_setting.allow_private_ip", type: "bool", label: "Allow Private IP" },
          {
            key: "fetch_setting.domain_filter_mode",
            type: "select",
            label: "Domain Filter Mode",
            options: [
              { value: "disabled", label: "Disabled" },
              { value: "allowlist", label: "Allowlist" },
              { value: "blocklist", label: "Blocklist" },
            ],
          },
          {
            key: "fetch_setting.ip_filter_mode",
            type: "select",
            label: "IP Filter Mode",
            options: [
              { value: "disabled", label: "Disabled" },
              { value: "allowlist", label: "Allowlist" },
              { value: "blocklist", label: "Blocklist" },
            ],
          },
          { key: "fetch_setting.domain_list", label: "Domain List", type: "textarea", rows: 6 },
          { key: "fetch_setting.ip_list", label: "IP List", type: "textarea", rows: 6 },
          { key: "fetch_setting.allowed_ports", label: "Allowed Ports", type: "textarea", rows: 3 },
          { key: "fetch_setting.apply_ip_filter_for_domain", type: "bool", label: "Apply IP Filter for Domain" },
        ],
      },
    ],
  },
];

export function findCategory(id: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function findSection(
  categoryId: string,
  sectionId: string
): { category: CategoryDef; section: SectionDef } | undefined {
  const category = findCategory(categoryId);
  if (!category) return undefined;
  const section = category.sections.find((s) => s.id === sectionId);
  if (!section) return undefined;
  return { category, section };
}
