import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationState {
  lastReadNotice: string;
  readAnnouncementKeys: string[];
  closedUntil: string | null;
  setLastReadNotice: (content: string) => void;
  addReadAnnouncement: (key: string) => void;
  setClosedUntil: (date: string | null) => void;
  isAnnouncementRead: (key: string) => boolean;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      lastReadNotice: "",
      readAnnouncementKeys: [],
      closedUntil: null,
      setLastReadNotice: (content) => set({ lastReadNotice: content }),
      addReadAnnouncement: (key) =>
        set((s) => ({
          readAnnouncementKeys: s.readAnnouncementKeys.includes(key)
            ? s.readAnnouncementKeys
            : [...s.readAnnouncementKeys, key],
        })),
      setClosedUntil: (date) => set({ closedUntil: date }),
      isAnnouncementRead: (key) =>
        get().readAnnouncementKeys.includes(key),
    }),
    { name: "notification-storage" }
  )
);
