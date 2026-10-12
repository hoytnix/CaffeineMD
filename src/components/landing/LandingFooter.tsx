import React from 'react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/10 py-8 px-4 text-center text-xs text-[#6e7e75] z-10">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[#94a39b]">
          <span>☕</span>
          <span className="font-semibold text-white">CaffeineMD</span>
          <span>•</span>
          <span>Local-First Personal Knowledge Base</span>
        </div>

        <p>
          Copyright © 2026 ISICECAKEOISIS INC. A{' '}
          <a
            href="https://tehwiz.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#94a39b] hover:text-emerald-400 underline underline-offset-4 transition-colors"
          >
            TehWiz Production
          </a>
          .
        </p>
      </div>
    </footer>
  );
};
