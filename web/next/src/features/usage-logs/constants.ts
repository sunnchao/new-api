import type { LogCategory } from "./types";
import type { StatusVariant } from "@/components/status-badge";

export const PAGE_SIZE = 20;

export const LOG_TYPE_ENUM = {
  UNKNOWN: 0,
  TOPUP: 1,
  CONSUME: 2,
  MANAGE: 3,
  SYSTEM: 4,
  CHECKIN: 5,
  ERROR: 6,
  REFUND: 7,
  ARCHIVE: 8,
  ERROR_FOR_ADMIN: 9,
  SUBSCRIPTION_PAY: 10,
} as const;

export const LOG_TYPES = [
  { value: 0, label: "Unknown", variant: "neutral" },
  { value: 1, label: "Top-up", variant: "cyan" },
  { value: 2, label: "Consume", variant: "green" },
  { value: 3, label: "Manage", variant: "orange" },
  { value: 4, label: "System", variant: "purple" },
  { value: 5, label: "Sign", variant: "red" },
  { value: 6, label: "Error", variant: "red" },
  { value: 7, label: "Refund", variant: "blue" },
  { value: 8, label: "Archive", variant: "blue" },
  { value: 9, label: "Admin Error", variant: "red" },
  { value: 10, label: "Subscription", variant: "violet" },
] as const satisfies ReadonlyArray<{
  value: number;
  label: string;
  variant: StatusVariant;
}>;

export const LOG_CATEGORY_META = {
  common: {
    title: "Common Logs",
    description: "View and manage API usage, billing, and request records",
    href: "/usage-logs/common",
  },
  drawing: {
    title: "Drawing Logs",
    description: "Track Midjourney drawing tasks and image generation status",
    href: "/usage-logs/drawing",
  },
  task: {
    title: "Task Logs",
    description: "Track asynchronous music and video generation tasks",
    href: "/usage-logs/task",
  },
} as const satisfies Record<
  LogCategory,
  { title: string; description: string; href: string }
>;

export const LOG_CATEGORY_IDS = Object.keys(LOG_CATEGORY_META) as LogCategory[];

export const DEFAULT_COMMON_FILTERS: CommonLogFiltersShape = {
  startTime: "",
  endTime: "",
  type: "all",
  model: "",
  token: "",
  group: "",
  username: "",
  channel: "",
  requestId: "",
};

export const DEFAULT_TASK_FILTERS = {
  startTime: "",
  endTime: "",
  filter: "",
  channel: "",
};

export const TASK_STATUS_MAPPINGS: Record<
  string,
  { label: string; variant: StatusVariant }
> = {
  SUCCESS: { label: "Success", variant: "green" },
  NOT_START: { label: "Not Started", variant: "neutral" },
  SUBMITTED: { label: "Queued", variant: "yellow" },
  IN_PROGRESS: { label: "In Progress", variant: "blue" },
  FAILURE: { label: "Failed", variant: "red" },
  QUEUED: { label: "Queued", variant: "orange" },
  UNKNOWN: { label: "Unknown", variant: "neutral" },
  MODAL: { label: "Waiting", variant: "amber" },
};

export const TASK_ACTION_MAPPINGS: Record<
  string,
  { label: string; variant: StatusVariant }
> = {
  IMAGINE: { label: "Draw", variant: "blue" },
  UPSCALE: { label: "Upscale", variant: "orange" },
  VIDEO: { label: "Video", variant: "orange" },
  EDITS: { label: "Edit", variant: "orange" },
  VARIATION: { label: "Vary", variant: "violet" },
  HIGH_VARIATION: { label: "Vary (Strong)", variant: "violet" },
  LOW_VARIATION: { label: "Vary (Subtle)", variant: "violet" },
  PAN: { label: "Pan", variant: "cyan" },
  DESCRIBE: { label: "Describe", variant: "yellow" },
  BLEND: { label: "Blend", variant: "lime" },
  UPLOAD: { label: "Upload", variant: "blue" },
  SHORTEN: { label: "Shorten", variant: "pink" },
  REROLL: { label: "Reroll", variant: "indigo" },
  INPAINT: { label: "Inpaint", variant: "teal" },
  SWAP_FACE: { label: "Swap Face", variant: "purple" },
  ZOOM: { label: "Zoom", variant: "green" },
  CUSTOM_ZOOM: { label: "Custom Zoom", variant: "green" },
  MUSIC: { label: "Generate Music", variant: "neutral" },
  LYRICS: { label: "Generate Lyrics", variant: "pink" },
  generate: { label: "Image to Video", variant: "blue" },
  textGenerate: { label: "Text to Video", variant: "blue" },
  firstTailGenerate: { label: "First/Last Frame to Video", variant: "blue" },
  referenceGenerate: { label: "Reference Video", variant: "blue" },
  remixGenerate: { label: "Video Remix", variant: "blue" },
};

type CommonLogFiltersShape = {
  startTime: string;
  endTime: string;
  type: string;
  model: string;
  token: string;
  group: string;
  username: string;
  channel: string;
  requestId: string;
};
