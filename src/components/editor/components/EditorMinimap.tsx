'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { Eye, EyeOff } from 'lucide-react';

interface EditorMinimapProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  content: string;
}

export function EditorMinimap({ containerRef, content }: EditorMinimapProps) {
  const { showMinimap, toggleMinimap } = useWorkspaceStore();
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const scrollStartRef = useRef(0);

  const [sliderTop, setSliderTop] = useState(0);
  const [sliderHeight, setSliderHeight] = useState(40);

  // Parse lines for micro-render
  const lines = useMemo(() => {
    return content.split('\n').slice(0, 500); // Top 500 lines for crisp performance
  }, [content]);

  // Sync slider position on scroll
  const updateSlider = useCallback(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const trackHeight = track.clientHeight;

    if (scrollHeight <= clientHeight) {
      setSliderTop(0);
      setSliderHeight(trackHeight);
      return;
    }

    const ratio = trackHeight / scrollHeight;
    const computedHeight = Math.max(clientHeight * ratio, 24);
    const maxTop = trackHeight - computedHeight;
    const computedTop = Math.min((scrollTop / (scrollHeight - clientHeight)) * maxTop, maxTop);

    setSliderTop(computedTop);
    setSliderHeight(computedHeight);
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !showMinimap) return;

    let rafId: number;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateSlider);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    updateSlider();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [containerRef, updateSlider, showMinimap, content]);

  // Handle Dragging Slider
  const handleMouseDownSlider = (e: React.MouseEvent) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    scrollStartRef.current = containerRef.current?.scrollTop || 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current || !trackRef.current) return;
      const deltaY = moveEvent.clientY - dragStartYRef.current;
      const container = containerRef.current;
      const track = trackRef.current;
      const scrollFactor = (container.scrollHeight - container.clientHeight) / (track.clientHeight - sliderHeight || 1);
      container.scrollTop = scrollStartRef.current + deltaY * scrollFactor;
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Handle Track Click Jump
  const handleTrackClick = (e: React.MouseEvent) => {
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container) return;

    const rect = track.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const ratio = clickY / rect.height;
    container.scrollTo({
      top: ratio * (container.scrollHeight - container.clientHeight),
      behavior: 'smooth',
    });
  };

  if (!showMinimap) {
    return (
      <button
        type="button"
        onClick={toggleMinimap}
        title="Show Minimap"
        className="absolute top-3 right-3 z-20 p-1 rounded-md bg-[var(--card)]/60 text-neutral-400 hover:text-[var(--foreground)] border border-[var(--border)] opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
      >
        <Eye className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <aside
      aria-label="Editor Minimap"
      className="hidden xl:flex flex-col w-24 h-full shrink-0 select-none relative group border-l border-[var(--border)]/40 bg-[var(--background)]/20"
    >
      {/* Hide Minimap Toggle on Hover */}
      <button
        type="button"
        onClick={toggleMinimap}
        title="Hide Minimap"
        className="absolute top-1 right-1 z-30 p-1 rounded text-neutral-400 hover:text-[var(--foreground)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        <EyeOff className="w-3 h-3" />
      </button>

      {/* Minimap Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="w-full flex-1 relative overflow-hidden py-4 px-2 cursor-pointer"
      >
        {/* Micro-lines Representation */}
        <div className="flex flex-col gap-[3px] pointer-events-none opacity-60">
          {lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) {
              return <div key={idx} className="h-[2px] w-full" />;
            }

            const isH1 = trimmed.startsWith('# ');
            const isH2 = trimmed.startsWith('## ');
            const isH3 = trimmed.startsWith('### ');
            const isCode = trimmed.startsWith('```');
            const isQuote = trimmed.startsWith('>');
            const isList = trimmed.startsWith('- ') || trimmed.startsWith('* ');

            const widthPercent = Math.min(Math.max((trimmed.length / 80) * 100, 15), 95);

            return (
              <div
                key={idx}
                style={{ width: `${widthPercent}%` }}
                className={`h-[2px] rounded-full transition-colors ${
                  isH1
                    ? 'bg-[var(--accent)] h-[3px] !w-[90%]'
                    : isH2
                    ? 'bg-[var(--accent)]/80 h-[2.5px] !w-[80%]'
                    : isH3
                    ? 'bg-[var(--accent)]/60 h-[2.5px] !w-[70%]'
                    : isCode
                    ? 'bg-amber-500/70'
                    : isQuote
                    ? 'bg-emerald-500/60'
                    : isList
                    ? 'bg-blue-400/60'
                    : 'bg-neutral-400 dark:bg-neutral-600'
                }`}
              />
            );
          })}
        </div>

        {/* Viewport Slider Highlight Box */}
        <div
          onMouseDown={handleMouseDownSlider}
          style={{
            top: `${sliderTop}px`,
            height: `${sliderHeight}px`,
          }}
          className="absolute left-1 right-1 rounded-md bg-[var(--accent)]/15 border border-[var(--accent)]/50 shadow-sm cursor-grab active:cursor-grabbing backdrop-blur-[1px] transition-all"
        />
      </div>
    </aside>
  );
}
