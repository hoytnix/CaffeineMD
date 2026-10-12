'use client';

import React from 'react';
import { usePwaInstall } from '@/src/components/landing/hooks/usePwaInstall';
import { LandingNav } from '@/src/components/landing/LandingNav';
import { LandingHero } from '@/src/components/landing/LandingHero';
import { LandingFeatures } from '@/src/components/landing/LandingFeatures';
import { LandingComparison } from '@/src/components/landing/LandingComparison';
import { LandingShortcuts } from '@/src/components/landing/LandingShortcuts';
import { LandingMegaCTA } from '@/src/components/landing/LandingMegaCTA';
import { LandingFooter } from '@/src/components/landing/LandingFooter';
import { InstallModal } from '@/src/components/landing/InstallModal';

export default function SqueezePage() {
  const installState = usePwaInstall();

  if (installState.isStandalone) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#090d0b] text-[#e1e7e4] flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-200 relative overflow-x-hidden">
      {/* Background ambient radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-emerald-500/10 blur-[130px] pointer-events-none" />

      {/* Sticky Navigation Bar with Install CTA */}
      <LandingNav installState={installState} />

      {/* Main Long-form Hero & Feature Stream */}
      <main className="flex-1 flex flex-col z-10">
        <LandingHero installState={installState} />
        <LandingFeatures installState={installState} />
        <LandingComparison installState={installState} />
        <LandingShortcuts installState={installState} />
        <LandingMegaCTA installState={installState} />
      </main>

      {/* Interactive Platform-Specific Install Guide Modal */}
      <InstallModal installState={installState} />

      {/* Official TehWiz Production Footer */}
      <LandingFooter />
    </div>
  );
}
