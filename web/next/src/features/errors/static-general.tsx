"use client";

import { GeneralErrorPage } from "./general";

const routeError = new Error("Internal Server Error");

export function StaticGeneralErrorPage() {
  return <GeneralErrorPage error={routeError} reset={() => window.location.reload()} />;
}
