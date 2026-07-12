import { createFileRoute, redirect } from "@tanstack/react-router";
import { decodeBuildCode } from "../lib/build-code";
import { importBuildAsNew } from "../lib/import-utils";

// `/import#<code>` — uses the URL hash fragment so large build codes
// bypass server/browser URL-path length caps that break `/import/<code>`.
// Kept the path-param route for backwards compatibility with older share links.
export const Route = createFileRoute("/import")({
  component: ImportPage,
  beforeLoad: () => {
    if (typeof window === "undefined") {
      throw redirect({ to: "/", search: { importError: "invalid" } });
    }
    const code = window.location.hash.replace(/^#/, "");
    if (code === "") {
      throw redirect({ to: "/", search: { importError: "invalid" } });
    }
    const decoded = decodeBuildCode(code);
    if (decoded === null) {
      throw redirect({ to: "/", search: { importError: "invalid" } });
    }
    const result = importBuildAsNew(decoded);
    if (result === undefined) {
      throw redirect({ to: "/", search: { importError: "save_failed" } });
    }
    throw redirect({ to: "/builder", search: { id: result.saveId } });
  },
});

function ImportPage(): React.ReactNode {
  return null;
}
