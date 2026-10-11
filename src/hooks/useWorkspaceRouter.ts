import { useEffect } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export function useWorkspaceRouter() {
  const {
    activeWorkspaceId,
    activeTab, // "editor" | "graph" | "table" | "kanban" | "list"
    activeNotePath,
    setActiveTab,
    setActiveNotePath,
    setActiveWorkspaceId,
  } = useWorkspaceStore();

  // 1. Initial parse on load & listen to popstate / browser forward/back
  useEffect(() => {
    const handleLocationChange = () => {
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      // Format: /w/:workspaceId or fallback to default
      if (pathParts[0] === "w" && pathParts[1]) {
        setActiveWorkspaceId(decodeURIComponent(pathParts[1]));
      }

      // Hash fragment parsing: #/view or #/editor/path/to/note.md
      const hash = window.location.hash.replace(/^#\/?/, "");
      if (hash) {
        const [view, ...rest] = hash.split("/");
        const notePath = rest.join("/");

        if (["editor", "graph", "table", "kanban", "board", "list", "tags", "settings"].includes(view)) {
          setActiveTab(view as any);
        }
        if (notePath) {
          setActiveNotePath(decodeURIComponent(notePath));
        }
      }
    };

    handleLocationChange();
    window.addEventListener("hashchange", handleLocationChange);
    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener("hashchange", handleLocationChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, [setActiveTab, setActiveNotePath, setActiveWorkspaceId]);

  // 2. Reflect state changes in the URL hash seamlessly
  useEffect(() => {
    if (!activeWorkspaceId) return;

    const baseWorkspacePath = `/w/${encodeURIComponent(activeWorkspaceId)}`;
    let hash = `#/${activeTab}`;
    if (activeTab === "editor" && activeNotePath) {
      hash = `#/${activeTab}/${encodeURIComponent(activeNotePath)}`;
    }

    const targetUrl = `${baseWorkspacePath}${hash}`;
    const currentUrl = `${window.location.pathname}${window.location.hash}`;

    if (currentUrl !== targetUrl) {
      window.history.replaceState(null, "", targetUrl);
    }
  }, [activeWorkspaceId, activeTab, activeNotePath]);
}
