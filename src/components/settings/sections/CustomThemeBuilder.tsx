'use client';

import React from 'react';
import { ThemeDefinition } from '@/src/lib/themes/themeDefinitions';
import { AiThemeStudioCard } from './AiThemeStudioCard';
import { CustomThemeWizard } from './CustomThemeWizard';

export interface CustomThemeBuilderProps {
  customTheme: ThemeDefinition;
  updateCustomTheme: (partial: Partial<ThemeDefinition>) => void;
  setTheme: (id: string) => void;
  showCustomWizard: boolean;
  setShowCustomWizard: (show: boolean) => void;
}

export function CustomThemeBuilder({
  customTheme,
  updateCustomTheme,
  setTheme,
  showCustomWizard,
  setShowCustomWizard,
}: CustomThemeBuilderProps) {
  return (
    <div className="space-y-6">
      {/* 1. AI Theme Studio Generator (Visible when Gemini BYOK key is set) */}
      <AiThemeStudioCard
        updateCustomTheme={updateCustomTheme}
        setTheme={setTheme}
        setShowCustomWizard={setShowCustomWizard}
      />

      {/* 2. Custom Theme Inline Color & Backdrop Wizard (Visible when custom or toggled) */}
      <CustomThemeWizard
        customTheme={customTheme}
        updateCustomTheme={updateCustomTheme}
        showCustomWizard={showCustomWizard}
        setShowCustomWizard={setShowCustomWizard}
      />
    </div>
  );
}
