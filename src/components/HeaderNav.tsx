import React from 'react';
import { FileDown } from 'lucide-react';
import type { AppSection } from '../types';

interface HeaderNavProps {
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  pendingReviewCount: number;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeSection,
  onSelectSection,
  pendingReviewCount,
}) => {
  const navItems: Array<{ id: AppSection; label: string }> = [
    { id: 'candidatos', label: 'Candidatos' },
    { id: 'procesos', label: 'Procesos KPI' },
    {
      id: 'vacantes',
      label:
        pendingReviewCount > 0
          ? `Selección (${pendingReviewCount})`
          : 'Vacantes y Selección',
    },
    { id: 'psicologicas', label: 'Psicológicas IA' },
    { id: 'reportes', label: 'Reportes' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-[#E2E4E8] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 sm:gap-6 px-3 sm:px-6 md:h-16">
        {/* Zone 1: Single text element brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectSection('candidatos')}
          className="font-display text-sm sm:text-lg font-bold tracking-tight text-[#23272E] truncate min-w-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B26337]"
        >
          Compañía Minera Las Bravas
        </button>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B26337] ${
                  isActive
                    ? 'text-[#B26337] font-semibold'
                    : 'text-[#5C626D] hover:text-[#23272E]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-[#B26337]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="flex items-center shrink-0">
          <a
            href="/api/reports/admin-doc"
            download
            className="inline-flex min-h-[38px] md:min-h-[42px] items-center gap-1.5 sm:gap-2 rounded-lg bg-[#B26337] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#99522B] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B26337]"
          >
            <FileDown className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Informe Admin</span>
            <span className="sm:hidden">Informe</span>
          </a>
        </div>
      </div>
    </header>
  );
};
