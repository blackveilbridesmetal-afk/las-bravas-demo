import React, { useEffect, useMemo, useState } from 'react';
import { Download, RotateCcw, ShieldCheck, Type as TypeIcon } from 'lucide-react';
import { HeaderNav } from './components/HeaderNav';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AppInstallModal } from './components/AppInstallModal';
import { CandidatesDashboard } from './components/CandidatesDashboard';
import { ProcessesKPIModule } from './components/ProcessesKPIModule';
import { VacanciesSelectionModule } from './components/VacanciesSelectionModule';
import { PsychTestsModule } from './components/PsychTestsModule';
import { ReportsExportModule } from './components/ReportsExportModule';
import { usePWAInstall } from './hooks/usePWAInstall';
import { createInitialState } from './data/seedData';
import { computeRecruitmentKPIs } from './utils/recruitment';
import type {
  AppSection,
  AppStatePayload,
  CandidateDecision,
  JobUrgency,
} from './types';

export default function App() {
  const [appState, setAppState] = useState<AppStatePayload>(() => createInitialState());
  const [activeSection, setActiveSection] = useState<AppSection>('candidatos');
  const [focusedCandidateId, setFocusedCandidateId] = useState<string | null>(null);
  const [largeTextMode, setLargeTextMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const {
    isInstallable,
    isInstalled,
    detectedPlatform,
    install: installPWA,
    markAsInstalled,
  } = usePWAInstall();
  const [showInstallWindow, setShowInstallWindow] = useState<boolean>(() => !isInstalled);

  useEffect(() => {
    if (isInstalled) {
      setShowInstallWindow(false);
    }
  }, [isInstalled]);

  const fetchLatestState = async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = (await res.json()) as AppStatePayload;
        if (data && data.companyName === 'Compañía Minera Las Bravas') {
          setAppState(data);
        }
      }
    } catch {
      // Fallback to local initial seed if offline
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchLatestState();
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = largeTextMode ? '17.5px' : '16px';
  }, [largeTextMode]);

  const kpis = useMemo(() => computeRecruitmentKPIs(appState), [appState]);

  const pendingReviewCount = useMemo(
    () =>
      appState.candidates.filter(
        (c) =>
          c.decision === 'Pendiente de revisión' || c.decision === 'En prueba práctica'
      ).length,
    [appState.candidates]
  );

  const handleNavigate = (section: AppSection, candidateId?: string) => {
    if (candidateId) {
      setFocusedCandidateId(candidateId);
    }
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddCandidate = async (payload: {
    fullName: string;
    age: number;
    originLocation: string;
    university: string;
    career: string;
    yearsWorked: number;
    workHistorySummary: string;
    specifications: string;
    phoneOrEmail: string;
    sourceBoardId: string;
    targetNeedId: string;
    interviewNotes: string;
  }) => {
    const res = await fetch('/api/recruitment/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || 'Error registrando postulante.');
    }
    const data = (await res.json()) as { state: AppStatePayload };
    setAppState(data.state);
  };

  const handleSendToJobBoard = async (payload: { boardId: string; needId: string }) => {
    const res = await fetch('/api/recruitment/job-boards/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || 'Error enviando propuesta a bolsa.');
    }
    const data = (await res.json()) as { state: AppStatePayload };
    setAppState(data.state);
  };

  const handleAddJobNeed = async (payload: {
    title: string;
    department: string;
    urgency: JobUrgency;
    vacancies: number;
    requiredSkills: string;
    technicalSpecifications: string;
    companyContext: string;
    publishedBoards: string[];
  }) => {
    const res = await fetch('/api/recruitment/needs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || 'Error creando vacante.');
    }
    const data = (await res.json()) as { state: AppStatePayload };
    setAppState(data.state);
  };

  const handleEvaluateCandidate = async (
    candidateId: string,
    payload: {
      managerScore: number;
      decision: CandidateDecision;
      managerNotes: string;
      teachAi: boolean;
      criterionTitle: string;
      criterionRule: string;
      criterionWeight: 'Prioritario' | 'Importante' | 'Deseable';
      isCorrection: boolean;
      wrongAiAssumption: string;
    }
  ) => {
    const res = await fetch(`/api/recruitment/candidates/${candidateId}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        evaluatedBy: appState.hrChiefName,
      }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || 'Error guardando evaluación del Jefe de RR.HH.');
    }
    const data = (await res.json()) as { state: AppStatePayload };
    setAppState(data.state);
  };

  const handleSendPsychTest = async (payload: {
    candidateId: string;
    testBatteryName: string;
  }) => {
    const res = await fetch('/api/recruitment/psych-tests/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || 'Error enviando prueba psicológica.');
    }
    const data = (await res.json()) as { state: AppStatePayload };
    setAppState(data.state);
  };

  const handleSubmitPsychTest = async (
    candidateId: string,
    answers: {
      estabilidad: number;
      tolerancia: number;
      seguridad: number;
      equipo: number;
      razonamiento: number;
    }
  ) => {
    const res = await fetch(`/api/recruitment/psych-tests/${candidateId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || 'Error procesando respuestas psicológicas.');
    }
    const data = (await res.json()) as { state: AppStatePayload };
    setAppState(data.state);
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/state/reset', { method: 'POST' });
      if (res.ok) {
        const data = (await res.json()) as AppStatePayload;
        setAppState(data);
        setFocusedCandidateId(null);
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] text-[#23272E] pb-20 md:pb-8">
      <HeaderNav
        activeSection={activeSection}
        onSelectSection={(section) => handleNavigate(section)}
        pendingReviewCount={pendingReviewCount}
      />

      {/* Slim Chief of HR Context Bar */}
      <div className="border-b border-[#E2E4E8] bg-[#EFEFF1]/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#5C626D]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#B26337]" />
            <span>
              <strong className="font-semibold text-[#23272E]">Control Jefe de RR.HH.</strong>
              {' · '}
              {appState.hrChiefName} ({appState.hrChiefTitle})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {!isInstalled && (
              <button
                type="button"
                onClick={() => setShowInstallWindow(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6CDBE] bg-[#FBF4EE] px-3 py-1.5 text-xs font-semibold text-[#8C4722] hover:bg-[#F4E7DC] transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-[#B26337]" />
                <span>Descargar App</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setLargeTextMode((prev) => !prev)}
              aria-pressed={largeTextMode}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                largeTextMode
                  ? 'border-[#B26337] bg-[#FBF4EE] text-[#8C4722]'
                  : 'border-[#D4D7DD] bg-white text-[#5C626D] hover:bg-[#EFEFF1]'
              }`}
            >
              <TypeIcon className="h-3.5 w-3.5" />
              <span>{largeTextMode ? 'Texto Estándar' : 'Texto Grande'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetDemo}
              disabled={isResetting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4D7DD] bg-white px-3 py-1.5 text-xs font-semibold text-[#5C626D] hover:bg-[#EFEFF1] hover:text-[#23272E] transition-colors cursor-pointer disabled:opacity-60"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{isResetting ? 'Restaurando...' : 'Restaurar datos demo'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <main className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {isLoading ? (
          <div className="rounded-xl border border-[#E2E4E8] bg-white p-10 text-center text-sm text-[#5C626D]">
            Cargando plataforma de reclutamiento de Compañía Minera Las Bravas...
          </div>
        ) : (
          <>
            {activeSection === 'candidatos' && (
              <CandidatesDashboard
                candidates={appState.candidates}
                jobNeeds={appState.jobNeeds}
                jobBoards={appState.jobBoards}
                kpis={kpis}
                onAddCandidate={handleAddCandidate}
                onNavigate={handleNavigate}
              />
            )}

            {activeSection === 'procesos' && (
              <ProcessesKPIModule
                jobNeeds={appState.jobNeeds}
                jobBoards={appState.jobBoards}
                kpis={kpis}
                onSendToJobBoard={handleSendToJobBoard}
              />
            )}

            {activeSection === 'vacantes' && (
              <VacanciesSelectionModule
                hrChiefName={appState.hrChiefName}
                jobNeeds={appState.jobNeeds}
                jobBoards={appState.jobBoards}
                candidates={appState.candidates}
                recruitmentCriteria={appState.recruitmentCriteria}
                initialCandidateId={focusedCandidateId}
                onAddJobNeed={handleAddJobNeed}
                onEvaluateCandidate={handleEvaluateCandidate}
                onRefreshState={fetchLatestState}
              />
            )}

            {activeSection === 'psicologicas' && (
              <PsychTestsModule
                hrChiefName={appState.hrChiefName}
                candidates={appState.candidates}
                initialCandidateId={focusedCandidateId}
                onSendPsychTest={handleSendPsychTest}
                onSubmitPsychTest={handleSubmitPsychTest}
              />
            )}

            {activeSection === 'reportes' && (
              <ReportsExportModule
                companyName={appState.companyName}
                hrChiefName={appState.hrChiefName}
                candidates={appState.candidates}
                jobNeeds={appState.jobNeeds}
                jobBoards={appState.jobBoards}
                kpis={kpis}
                onStateRestored={(nextState) => setAppState(nextState)}
              />
            )}
          </>
        )}
      </main>

      <MobileBottomNav
        activeSection={activeSection}
        onSelectSection={(section) => handleNavigate(section)}
        pendingReviewCount={pendingReviewCount}
      />

      <AppInstallModal
        isInstalled={isInstalled}
        isInstallable={isInstallable}
        detectedPlatform={detectedPlatform}
        isOpen={showInstallWindow}
        onClose={() => setShowInstallWindow(false)}
        onInstallNative={installPWA}
        onMarkInstalled={markAsInstalled}
      />

      <OfflineIndicator />
    </div>
  );
}
