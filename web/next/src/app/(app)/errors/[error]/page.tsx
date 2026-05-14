import {
  ForbiddenPage,
  MaintenancePage,
  NotFoundPage,
  StaticGeneralErrorPage,
  UnauthorizedPage,
} from "@/features/errors";

const ERROR_COMPONENTS = {
  unauthorized: UnauthorizedPage,
  forbidden: ForbiddenPage,
  "not-found": NotFoundPage,
  "internal-server-error": StaticGeneralErrorPage,
  "maintenance-error": MaintenancePage,
} satisfies Record<string, React.ComponentType>;

export default async function Page({
  params,
}: {
  params: Promise<{ error: string }>;
}) {
  const { error } = await params;
  const ErrorComponent = ERROR_COMPONENTS[error as keyof typeof ERROR_COMPONENTS] ?? NotFoundPage;

  return <ErrorComponent />;
}
