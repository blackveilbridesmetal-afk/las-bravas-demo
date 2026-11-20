import React from 'react';
import {
  BarChart3,
  BrainCircuit,
  Briefcase,
  FileDown,
  Users,
} from 'lucide-react';
import type { AppSection } from '../types';

interface MobileBottomNavProps {
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  pendingReviewCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeSection,
  onSelectSection,
  pendingReviewCount,
}) => {
  const tabs: Array<{
    id: AppSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'candidatos', label: 'Candidatos', icon: Users },
    { id: 'procesos', label: 'Procesos', icon: BarChart3 },
    {
      id: 'vacantes',
      label: 'Selección',
      icon: Briefcase,
      badge: pendingReviewCount,
    },
    { id: 'psicologicas', label: 'Psico IA', icon: BrainCircuit },
    { id: 'reportes', label: 'Reportes', icon: FileDown },
  ];

  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E2E4E8] bg-white/95 backdrop-blur-md md:hidden"
    >
      <div className="grid h-16 grid-cols-5 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectSection(tab.id)}
              className={`relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 px-1 transition-colors cursor-pointer ${
                isActive ? 'text-[#B26337]' : 'text-[#5C626D] hover:text-[#23272E]'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[11px] font-medium tracking-tight truncate max-w-full">
                {tab.label}
              </span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute top-1.5 right-3 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#B26337] px-1 text-[10px] font-bold text-white tabular-nums">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
