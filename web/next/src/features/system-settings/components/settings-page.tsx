"use client";

import { useTranslation } from "react-i18next";
import { useSystemOptions, getOptionValue } from "../hooks/use-system-options";

type SettingsPageProps<
  TSettings extends Record<string, string | number | boolean | unknown[]>,
  TSectionId extends string,
  TExtraArgs extends unknown[] = [],
> = {
  sectionId?: string;
  routePath?: string;
  defaultSettings: TSettings;
  defaultSection: TSectionId;
  getSectionContent: (
    sectionId: TSectionId,
    settings: TSettings,
    ...extraArgs: TExtraArgs
  ) => React.ReactNode;
  extraArgs?: TExtraArgs;
};

export function SettingsPage<
  TSettings extends Record<string, string | number | boolean | unknown[]>,
  TSectionId extends string,
  TExtraArgs extends unknown[] = [],
>({
  sectionId,
  routePath,
  defaultSettings,
  defaultSection,
  getSectionContent,
  extraArgs = [] as unknown as TExtraArgs,
}: SettingsPageProps<TSettings, TSectionId, TExtraArgs>) {
  const { t } = useTranslation();
  const { data, isLoading } = useSystemOptions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[var(--muted)]">
          {t("Loading settings...")}
        </div>
      </div>
    );
  }

  const settings = getOptionValue(data?.data, defaultSettings) as TSettings;
  const activeSection = (sectionId ?? defaultSection) as TSectionId;
  const sectionContent = getSectionContent(activeSection, settings, ...extraArgs);

  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <div className="h-full w-full overflow-y-auto scroll-smooth pe-4 pb-12">
        <div className="space-y-4">{sectionContent}</div>
      </div>
    </div>
  );
}
