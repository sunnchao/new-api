"use client";

import { REDEMPTION_STATUS } from "../constants";

export function isTimestampExpired(timestamp: number | null | undefined): boolean {
  if (!timestamp || timestamp <= 0) return false;
  return timestamp < Math.floor(Date.now() / 1000);
}

export function isRedemptionExpired(
  expiredTime: number | null | undefined,
  status: number,
): boolean {
  return status === REDEMPTION_STATUS.ENABLED && isTimestampExpired(expiredTime);
}
