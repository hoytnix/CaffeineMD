'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';

export default function RootPage() {
  const router = useRouter();
  const { activeWorkspaceId, activeTab } = useWorkspaceStore();

  // Redirect to active workspace on mount
  useEffect(() => {
    const wsId = activeWorkspaceId || 'default-vault';
    const tab = activeTab || 'editor';
    const hash = typeof window !== 'undefined' && window.location.hash
      ? window.location.hash
      : `#/${tab}`;
    router.replace(`/w/${encodeURIComponent(wsId)}${hash}`);
  }, [activeWorkspaceId, activeTab, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        <span>Loading workspace...</span>
      </div>
    </div>
  );
}
