"use client";

import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

type SlotProps = { children?: ReactNode };

function SectionPageLayoutTitle(_props: SlotProps) {
  return null;
}
SectionPageLayoutTitle.displayName = "SectionPageLayout.Title";

function SectionPageLayoutDescription(_props: SlotProps) {
  return null;
}
SectionPageLayoutDescription.displayName = "SectionPageLayout.Description";

function SectionPageLayoutActions(_props: SlotProps) {
  return null;
}
SectionPageLayoutActions.displayName = "SectionPageLayout.Actions";

function SectionPageLayoutContent(_props: SlotProps) {
  return null;
}
SectionPageLayoutContent.displayName = "SectionPageLayout.Content";

function SectionPageLayoutBreadcrumb(_props: SlotProps) {
  return null;
}
SectionPageLayoutBreadcrumb.displayName = "SectionPageLayout.Breadcrumb";

export type SectionPageLayoutProps = {
  children: ReactNode;
};

export function SectionPageLayout(props: SectionPageLayoutProps) {
  let title: ReactNode = null;
  let description: ReactNode = null;
  let actions: ReactNode = null;
  let content: ReactNode = null;
  let breadcrumb: ReactNode = null;

  Children.forEach(props.children, (node) => {
    if (!isValidElement(node)) return;
    const child = node as ReactElement<SlotProps>;
    if (child.type === SectionPageLayoutTitle) title = child.props.children;
    else if (child.type === SectionPageLayoutDescription) description = child.props.children;
    else if (child.type === SectionPageLayoutActions) actions = child.props.children;
    else if (child.type === SectionPageLayoutContent) content = child.props.children;
    else if (child.type === SectionPageLayoutBreadcrumb) breadcrumb = child.props.children;
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-3 pt-3 pb-2.5 sm:px-4 sm:pt-5 sm:pb-3">
        {breadcrumb != null ? <div className="mb-2 sm:mb-3">{breadcrumb}</div> : null}
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 sm:gap-x-4">
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-base font-bold tracking-tight sm:text-lg">
              {title}
            </h1>
            {description != null ? (
              <p className="max-w-3xl text-xs text-[var(--muted)] sm:text-sm">
                {description}
              </p>
            ) : null}
          </div>
          {actions != null ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-x-3">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 pt-1 pb-3 sm:px-4 sm:pt-1.5 sm:pb-4">
        {content}
      </div>
    </div>
  );
}

SectionPageLayout.Title = SectionPageLayoutTitle;
SectionPageLayout.Description = SectionPageLayoutDescription;
SectionPageLayout.Actions = SectionPageLayoutActions;
SectionPageLayout.Content = SectionPageLayoutContent;
SectionPageLayout.Breadcrumb = SectionPageLayoutBreadcrumb;
