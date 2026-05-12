"use client";

import type { TFunction } from "i18next";
import type { StatusBadgeProps } from "@/components/status-badge";

export const REDEMPTION_STATUS = {
  ENABLED: 1,
  DISABLED: 2,
  USED: 3,
} as const;

export const REDEMPTION_STATUSES: Record<
  number,
  Pick<StatusBadgeProps, "variant" | "showDot"> & { labelKey: string; value: number }
> = {
  [REDEMPTION_STATUS.ENABLED]: {
    labelKey: "Unused",
    variant: "success",
    value: REDEMPTION_STATUS.ENABLED,
    showDot: true,
  },
  [REDEMPTION_STATUS.DISABLED]: {
    labelKey: "Disabled",
    variant: "neutral",
    value: REDEMPTION_STATUS.DISABLED,
    showDot: true,
  },
  [REDEMPTION_STATUS.USED]: {
    labelKey: "Used",
    variant: "neutral",
    value: REDEMPTION_STATUS.USED,
    showDot: true,
  },
};

export const REDEMPTION_FILTER_EXPIRED = "expired";

export function getRedemptionStatusOptions(t: TFunction) {
  return [
    ...Object.values(REDEMPTION_STATUSES).map((config) => ({
      label: t(config.labelKey),
      value: String(config.value),
    })),
    {
      label: t("Expired"),
      value: REDEMPTION_FILTER_EXPIRED,
    },
  ];
}

export const REDEMPTION_VALIDATION = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 20,
  COUNT_MIN: 1,
  COUNT_MAX: 100,
};

export const ERROR_MESSAGES = {
  UNEXPECTED: "An unexpected error occurred",
  LOAD_FAILED: "Failed to load redemption codes",
  SEARCH_FAILED: "Failed to search redemption codes",
  CREATE_FAILED: "Failed to create redemption code",
  UPDATE_FAILED: "Failed to update redemption code",
  DELETE_FAILED: "Failed to delete redemption code",
  DELETE_INVALID_FAILED: "Failed to delete invalid redemption codes",
  STATUS_UPDATE_FAILED: "Failed to update redemption code status",
};

export const SUCCESS_MESSAGES = {
  REDEMPTION_CREATED: "Redemption code(s) created successfully",
  REDEMPTION_UPDATED: "Redemption code updated successfully",
  REDEMPTION_DELETED: "Redemption code deleted successfully",
  REDEMPTION_ENABLED: "Redemption code enabled successfully",
  REDEMPTION_DISABLED: "Redemption code disabled successfully",
  COPY_SUCCESS: "Copied to clipboard",
};
