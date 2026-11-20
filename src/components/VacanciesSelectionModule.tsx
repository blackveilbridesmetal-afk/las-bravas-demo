import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  Plus,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import type {
  Candidate,
  CandidateDecision,
  JobBoardChannel,
  JobNeed,
  JobUrgency,
  RecruitmentCriterion,
} from '../types';

interface VacanciesSelectionModuleProps {
  hrChiefName: string;
  jobNeeds: JobNeed[];
  jobBoards: JobBoardChannel[];
  candidates: Candidate[];
  recruitmentCriteria: RecruitmentCriterion[];
  initialCandidateId?: string | null;
  onAddJobNeed: (payload: {
    title: string;
    department: string;
    urgency: JobUrgency;
    vacancies: number;
    requiredSkills: string;
    technicalSpecifications: string;
    companyContext: string;
    publishedBoards: string[];
  }) => Promise<void>;
  onEvaluateCandidate: (
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
  ) => Promise<void>;
  onRefreshState: () => Promise<void>;
}

export const VacanciesSelectionModule: React.FC<VacanciesSelectionModuleProps> = ({
  hrChiefName,
  jobNeeds,
  jobBoards,
  candidates,
  recruitmentCriteria,
  initialCandidateId,
  onAddJobNeed,
  onEvaluateCandidate,
  onRefreshState,
}) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    initialCandidateId || candidates[0]?.id || ''
  );

  useEffect(() => {
    if (initialCandidateId) {
      setSelectedCandidateId(initialCandidateId);
    }
  }, [initialCandidateId]);

  const activeCandidate =
    candidates.find((c) => c.id === selectedCandidateId) ?? candidates[0] ?? null;

  // Chief of HR approval / correction state
  const [isCorrectionMode, setIsCorrectionMode] = useState(false);
  const [managerScore, setManagerScore] = useState<number>(4);
  const [decision, setDecision] = useState<CandidateDecision>('Preseleccionado');
  const [managerNotes, setManagerNotes] = useState('');
  const [wrongAiAssumption, setWrongAiAssumption] = useState('');
  const [criterionTitle, setCriterionTitle] = useState('');
  const [criterionRule, setCriterionRule] = useState('');
  const [criterionWeight, setCriterionWeight] = useState<
    'Prioritario' | 'Importante' | 'Deseable'
  >('Prioritario');
  const [evalFeedback, setEvalFeedback] = useState<string | null>(null);
  const [isSubmittingEval, setIsSubmittingEval] = useState(false);

  // Optional Gemini Deep Analysis
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDetail, setAiDetail] = useState<{
    recommendation: string;
    strengths: string[];
    watchouts: string[];
  } | null>(null);

  // New Vacancy Form
  const [showNeedForm, setShowNeedForm] = useState(false);
  const [needTitle, setNeedTitle] = useState('');
  const [needDept, setNeedDept] = useState('Operaciones Mina');
  const [needUrgency, setNeedUrgency] = useState<JobUrgency>('Urgente');
  const [needVacancies, setNeedVacancies] = useState('1');
  const [needSkills, setNeedSkills] = useState('');
  const [needSpecs, setNeedSpecs] = useState('');
  const [needContext, setNeedContext] = useState('');
  const [selectedBoards, setSelectedBoards] = useState<string[]>([
    'Computrabajo Minería',
    'LinkedIn Talento Minero',
  ]);
  const [needFeedback, setNeedFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCandidate) return;
    setManagerScore(
      activeCandidate.managerScore ??
        Math.max(3, Math.min(5, Math.round(activeCandidate.metricReport.overallScore / 20)))
    );
    setDecision(
      activeCandidate.decision === 'Pendiente de revisión'
        ? activeCandidate.aiProposedDecision
        : activeCandidate.decision
    );
    setManagerNotes(activeCandidate.managerNotes ?? '');
    setWrongAiAssumption(activeCandidate.aiSummary);
    setCriterionTitle(`Criterio Jefe RR.HH.: ${activeCandidate.targetRoleTitle}`);
    setCriterionRule('');
    setIsCorrectionMode(false);
    setAiError(null);
    setAiDetail(null);
  }, [activeCandidate?.id]);

  const handleQuickApproveAI = async () => {
    if (!activeCandidate) return;
    setIsSubmittingEval(true);
    setEvalFeedback(null);
    const targetDecision = activeCandidate.aiProposedDecision || 'Preseleccionado';
    const suggestedScore = Math.max(
      3,
      Math.min(5, Math.round(activeCandidate.metricReport.overallScore / 20))
    );
    try {
      await onEvaluateCandidate(activeCandidate.id, {
        managerScore: suggestedScore,
        decision: targetDecision,
        managerNotes:
          managerNotes.trim() ||
          `Aprobado por Jefe de RR.HH. (${hrChiefName}) según pre-evaluación IA.`,
        teachAi: false,
        criterionTitle: '',
        criterionRule: '',
        criterionWeight: 'Importante',
        isCorrection: false,
        wrongAiAssumption: '',
      });
      setEvalFeedback(
        `Visto bueno registrado: "${targetDecision}" aplicado a ${activeCandidate.fullName} conforme a la evaluación previa de la IA.`
      );
    } finally {
      setIsSubmittingEval(false);
    }
  };

  const handleSaveManualOrCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidate) return;
    setIsSubmittingEval(true);
    setEvalFeedback(null);
    try {
      await onEvaluateCandidate(activeCandidate.id, {
        managerScore,
        decision,
        managerNotes: managerNotes.trim(),
        teachAi: isCorrectionMode || Boolean(criterionRule.trim()),
        criterionTitle:
          criterionTitle.trim() || `Criterio de ${hrChiefName}`,
        criterionRule:
          criterionRule.trim() ||
          managerNotes.trim() ||
          `Ajuste de evaluación para ${activeCandidate.targetRoleTitle}`,
        criterionWeight,
        isCorrection: isCorrectionMode,
        wrongAiAssumption: isCorrectionMode ? wrongAiAssumption.trim() : '',
      });
      setEvalFeedback(
        isCorrectionMode
          ? `Corrección guardada y retroalimentada en la IA. Los puntajes de los candidatos fueron recalibrados.`
          : `Decisión de ${activeCandidate.fullName} actualizada a "${decision}".`
      );
      setIsCorrectionMode(false);
      setCriterionRule('');
    } finally {
      setIsSubmittingEval(false);
    }
  };

  const handleDeepGemini = async () => {
    if (!activeCandidate) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/evaluate-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: activeCandidate.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo consultar Gemini.');
      setAiDetail(data.evaluation);
      await onRefreshState();
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Error al consultar Gemini.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleToggleBoard = (boardName: string) => {
    setSelectedBoards((prev) =>
      prev.includes(boardName)
        ? prev.filter((b) => b !== boardName)
        : [...prev, boardName]
    );
  };

  const handleCreateNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!needTitle.trim() || !needSkills.trim()) return;
    await onAddJobNeed({
      title: needTitle.trim(),
      department: needDept,
      urgency: needUrgency,
      vacancies: Number(needVacancies) || 1,
      requiredSkills: needSkills.trim(),
      technicalSpecifications: needSpecs.trim() || needSkills.trim(),
      companyContext: needContext.trim(),
      publishedBoards: selectedBoards,
    });
    setNeedTitle('');
    setNeedSkills('');
    setNeedSpecs('');
    setNeedContext('');
    setShowNeedForm(false);
    setNeedFeedback(
      'Vacante por cubrir creada y publicada en las bolsas seleccionadas.'
    );
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Open Vacancies to Cover */}
      <section className="rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-3 border-b border-[#E2E4E8] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <Briefcase className="mt-0.5 h-5 w-5 shrink-0 text-[#B26337]" />
            <div>
              <h1 className="text-xl font-bold text-[#23272E]">
                Vacantes por Cubrir y Control del Jefe de RR.HH.
              </h1>
              <p className="mt-0.5 text-sm text-[#5C626D]">
                Cada vacante define especificaciones técnicas para que la IA filtre postulantes antes de pasar a tu visto bueno.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowNeedForm((v) => !v)}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#B26337] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#99522B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>{showNeedForm ? 'Cerrar Formulario' : 'Nueva Vacante'}</span>
          </button>
        </div>

        {needFeedback && (
          <p role="status" className="mt-4 rounded-lg border border-[#E6CDBE] bg-[#FBF4EE] px-4 py-2.5 text-sm font-medium text-[#8C4722]">
            {needFeedback}
          </p>
        )}

        {showNeedForm && (
          <form onSubmit={handleCreateNeed} className="mt-5 grid grid-cols-1 gap-4 border-b border-[#E2E4E8] pb-6 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <label htmlFor="v-title" className="block text-xs font-semibold text-[#23272E]">
                Puesto por cubrir
              </label>
              <input
                id="v-title"
                type="text"
                required
                value={needTitle}
                onChange={(e) => setNeedTitle(e.target.value)}
                placeholder="Ej: Jefe de Guardia Mina Subterránea"
                className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm"
              />
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="v-dept" className="block text-xs font-semibold text-[#23272E]">
                Área Minera
              </label>
              <select
                id="v-dept"
                value={needDept}
                onChange={(e) => setNeedDept(e.target.value)}
                className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm"
              >
                <option value="Operaciones Mina">Operaciones Mina</option>
                <option value="Seguridad HSEC">Seguridad HSEC</option>
                <option value="Control Metalúrgico">Control Metalúrgico</option>
                <option value="Logística y Campamento">Logística y Campamento</option>
                <option value="Mantenimiento Mina">Mantenimiento Mina</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="v-urgency" className="block text-xs font-semibold text-[#23272E]">
                Urgencia
              </label>
              <select
                id="v-urgency"
                value={needUrgency}
                onChange={(e) => setNeedUrgency(e.target.value as JobUrgency)}
                className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm"
              >
                <option value="Urgente">Urgente</option>
                <option value="Media">Media</option>
                <option value="Planificada">Planificada</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="v-qty" className="block text-xs font-semibold text-[#23272E]">
                Plazas
              </label>
              <input
                id="v-qty"
                type="number"
                min={1}
                max={20}
                value={needVacancies}
                onChange={(e) => setNeedVacancies(e.target.value)}
                className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 font-mono-tabular text-sm"
              />
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="v-skills" className="block text-xs font-semibold text-[#23272E]">
                Competencias clave para filtro IA
              </label>
              <input
                id="v-skills"
                type="text"
                required
                value={needSkills}
                onChange={(e) => setNeedSkills(e.target.value)}
                placeholder="Ej: ventilación mina, IPERC, turno 14x7, altura"
                className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm"
              />
            </div>
            <div className="sm:col-span-6">
              <label htmlFor="v-specs" className="block text-xs font-semibold text-[#23272E]">
                Especificaciones técnicas exigidas
              </label>
              <input
                id="v-specs"
                type="text"
                value={needSpecs}
                onChange={(e) => setNeedSpecs(e.target.value)}
                placeholder="Ej: Colegiado, 5+ años en socavón, Certificación HSEC"
                className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm"
              />
            </div>

            <div className="sm:col-span-12">
              <span className="block text-xs font-semibold text-[#23272E]">
                Enviar propuesta inicial a bolsas de trabajo:
              </span>
              <div className="mt-2 flex flex-wrap gap-3">
                {jobBoards.map((b) => (
                  <label key={b.id} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#23272E] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBoards.includes(b.name)}
                      onChange={() => handleToggleBoard(b.name)}
                      className="h-4 w-4 rounded border-[#D8DCE0] text-[#B26337]"
                    />
                    <span>{b.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="sm:col-span-9">
              <input
                type="text"
                value={needContext}
                onChange={(e) => setNeedContext(e.target.value)}
                placeholder="Contexto operativo en Unidad Las Bravas (opcional)"
                className="w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full min-h-[42px] rounded-lg bg-[#B26337] px-4 py-2 text-sm font-semibold text-white hover:bg-[#99522B] cursor-pointer"
              >
                Publicar Vacante
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 divide-y divide-[#EFEFF1]">
          {jobNeeds.map((need) => {
            const pendingCount = Math.max(0, need.vacancies - need.filledCount);
            const applicantsCount = candidates.filter((c) => c.targetNeedId === need.id).length;
            return (
              <div key={need.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-[#5C626D]">
                    {need.department} ·{' '}
                    <span className="font-semibold text-[#8C4722]">{need.urgency}</span> · Bolsas:{' '}
                    {need.publishedBoards.join(', ')}
                  </p>
                  <h2 className="mt-0.5 text-base font-bold text-[#23272E]">{need.title}</h2>
                  <p className="mt-0.5 text-xs text-[#5C626D]">{need.technicalSpecifications}</p>
                </div>
                <div className="flex items-center gap-6 shrink-0 font-mono-tabular text-xs">
                  <div>
                    <span className="text-[#5C626D]">Por cubrir: </span>
                    <strong className="text-sm text-[#B26337]">{pendingCount}</strong>
                    <span className="text-[#5C626D]">/{need.vacancies}</span>
                  </div>
                  <div>
                    <span className="text-[#5C626D]">Postulantes IA: </span>
                    <strong className="text-sm text-[#23272E]">{applicantsCount}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Pre-Analyzed Candidate Queue + Chief of HR Approval / AI Correction */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <section
          aria-labelledby="selection-list-heading"
          className="rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-7 lg:col-span-5"
        >
          <h2 id="selection-list-heading" className="border-b border-[#E2E4E8] pb-4 text-lg font-bold text-[#23272E]">
            Postulantes Pre-Evaluados por IA ({candidates.length})
          </h2>

          <div className="divide-y divide-[#EFEFF1]">
            {candidates.map((cand) => {
              const isSelected = activeCandidate?.id === cand.id;
              return (
                <button
                  key={cand.id}
                  type="button"
                  onClick={() => setSelectedCandidateId(cand.id)}
                  className={`w-full py-3.5 px-2.5 text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#FBF4EE]' : 'hover:bg-[#F7F7F8]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[#5C626D]">
                    <span>
                      {cand.age} años · {cand.originLocation}
                    </span>
                    <span className="font-mono-tabular font-bold text-[#B26337]">
                      IA {cand.metricReport.overallScore}/100
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm font-bold text-[#23272E]">{cand.fullName}</p>
                  <p className="text-xs text-[#5C626D]">
                    {cand.career} · {cand.yearsWorked} años exp.
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#5C626D]">
                    Propuesta IA: <span className="text-[#23272E]">{cand.aiProposedDecision}</span> ·{' '}
                    Estado: <span className="text-[#8C4722]">{cand.decision}</span>
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="hr-control-heading"
          className="rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-7 lg:col-span-7"
        >
          {!activeCandidate ? (
            <p className="py-10 text-center text-sm text-[#5C626D]">
              Selecciona un candidato para revisar el análisis previo de la IA.
            </p>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E4E8] pb-4">
                <div>
                  <p className="text-xs text-[#5C626D]">
                    {activeCandidate.targetRoleTitle} · {activeCandidate.university} ·{' '}
                    {activeCandidate.sourceBoardName}
                  </p>
                  <h2 id="hr-control-heading" className="mt-1 text-xl font-bold text-[#23272E]">
                    {activeCandidate.fullName}
                  </h2>
                </div>
                <a
                  href={`/api/reports/candidate/${activeCandidate.id}/doc`}
                  download
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#D8DCE0] bg-[#F7F7F8] px-3 py-1.5 text-xs font-semibold text-[#23272E] hover:bg-[#EFEFF1]"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>Ficha (.doc)</span>
                </a>
              </div>

              {/* AI Pre-Analysis Box */}
              <div className="rounded-lg border border-[#E2E4E8] bg-[#F7F7F8] p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-[#8C4722]">
                  <span>Propuesta IA: {activeCandidate.aiProposedDecision}</span>
                  <span aria-hidden="true" className="text-[#9CA3AF]">·</span>
                  <span className="font-mono-tabular">
                    Global {activeCandidate.metricReport.overallScore}/100
                  </span>
                  <span aria-hidden="true" className="text-[#9CA3AF]">·</span>
                  <span>
                    Psicológica:{' '}
                    {activeCandidate.psychEvaluation.averageScore !== null
                      ? `${activeCandidate.psychEvaluation.averageScore}/100 (${activeCandidate.psychEvaluation.aptitudeLevel})`
                      : activeCandidate.psychEvaluation.status}
                  </span>
                </div>
                {activeCandidate.aiAppliedCorrectionTitle && (
                  <p className="text-xs font-semibold text-[#B26337]">
                    Basado en corrección previa del Jefe de RR.HH.:{' '}
                    {activeCandidate.aiAppliedCorrectionTitle}
                  </p>
                )}
                <p className="text-sm leading-relaxed text-[#23272E]">
                  {activeCandidate.metricReport.aiDetailedReport}
                </p>
              </div>

              {evalFeedback && (
                <p role="status" className="rounded-lg border border-[#D2E3D8] bg-[#F2F7F4] px-4 py-2.5 text-sm font-medium text-[#3D7A5A]">
                  {evalFeedback}
                </p>
              )}

              {/* Primary 1-Click Approval OR Correction */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isSubmittingEval}
                  onClick={() => void handleQuickApproveAI()}
                  className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#B26337] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#99522B] transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    Está bien, lo apruebo ({activeCandidate.aiProposedDecision})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCorrectionMode((v) => !v)}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-[#E6CDBE] bg-[#FBF4EE] px-4 py-2.5 text-sm font-semibold text-[#8C4722] hover:bg-[#F4E7DC] transition-colors cursor-pointer"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    {isCorrectionMode ? 'Ocultar corrección' : 'Corregir criterio de IA'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => void handleDeepGemini()}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-[#D8DCE0] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#23272E] hover:bg-[#F7F7F8] cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-[#B26337] shrink-0" />
                  <span>{aiLoading ? 'Consultando...' : 'Informe Gemini IA'}</span>
                </button>
              </div>

              {aiError && (
                <p role="alert" className="text-xs font-medium text-[#A84444]">
                  {aiError}
                </p>
              )}
              {aiDetail && (
                <div className="space-y-1 border-t border-[#E2E4E8] pt-3 text-sm text-[#23272E]">
                  <p className="font-semibold text-[#8C4722]">{aiDetail.recommendation}</p>
                  {aiDetail.strengths?.length > 0 && (
                    <p>
                      <strong>Fortalezas:</strong> {aiDetail.strengths.join(', ')}
                    </p>
                  )}
                  {aiDetail.watchouts?.length > 0 && (
                    <p>
                      <strong>Puntos a acompañar:</strong> {aiDetail.watchouts.join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Detailed HR Chief Decision / Correction Form */}
              <form
                onSubmit={handleSaveManualOrCorrection}
                className="space-y-4 border-t border-[#E2E4E8] pt-5"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-xs font-semibold text-[#23272E]">
                      Calificación Jefe RR.HH. (1 a 5)
                    </span>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setManagerScore(num)}
                          className={`min-h-[40px] flex-1 rounded-lg border font-mono-tabular text-sm font-bold transition-colors cursor-pointer ${
                            managerScore === num
                              ? 'border-[#B26337] bg-[#B26337] text-white'
                              : 'border-[#D8DCE0] bg-white text-[#23272E] hover:bg-[#F7F7F8]'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="hr-decision" className="block text-xs font-semibold text-[#23272E]">
                      Decisión Oficial
                    </label>
                    <select
                      id="hr-decision"
                      value={decision}
                      onChange={(e) => setDecision(e.target.value as CandidateDecision)}
                      className="mt-1.5 w-full min-h-[40px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm text-[#23272E]"
                    >
                      <option value="Pendiente de revisión">Pendiente de revisión</option>
                      <option value="En prueba práctica">En prueba práctica</option>
                      <option value="Preseleccionado">Preseleccionado</option>
                      <option value="Contratado">Contratado (Cubre vacante)</option>
                      <option value="No apto">No apto</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="hr-notes" className="block text-xs font-semibold text-[#23272E]">
                    Observación del Jefe de RR.HH. ({hrChiefName})
                  </label>
                  <input
                    id="hr-notes"
                    type="text"
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    placeholder="Ej: Aprobado para terna final con Administración."
                    className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm text-[#23272E]"
                  />
                </div>

                {isCorrectionMode && (
                  <div className="space-y-3 rounded-lg border border-[#E6CDBE] bg-[#FBF4EE] p-4">
                    <p className="text-xs font-bold text-[#8C4722]">
                      Retroalimentar criterio a la IA (se aplicará en futuras evaluaciones)
                    </p>
                    <input
                      type="text"
                      value={wrongAiAssumption}
                      onChange={(e) => setWrongAiAssumption(e.target.value)}
                      placeholder="¿Qué evaluó mal la IA?"
                      className="w-full min-h-[40px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm"
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                      <input
                        type="text"
                        value={criterionTitle}
                        onChange={(e) => setCriterionTitle(e.target.value)}
                        placeholder="Título del criterio aprendido"
                        className="min-h-[40px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm sm:col-span-8"
                      />
                      <select
                        value={criterionWeight}
                        onChange={(e) =>
                          setCriterionWeight(
                            e.target.value as 'Prioritario' | 'Importante' | 'Deseable'
                          )
                        }
                        className="min-h-[40px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm sm:col-span-4"
                      >
                        <option value="Prioritario">Prioritario</option>
                        <option value="Importante">Importante</option>
                        <option value="Deseable">Deseable</option>
                      </select>
                    </div>
                    <textarea
                      rows={2}
                      value={criterionRule}
                      onChange={(e) => setCriterionRule(e.target.value)}
                      placeholder="Regla exacta que la IA debe recordar y citar (ej: Priorizar años en planta concentradora y altura sobre 4,000 msnm)"
                      className="w-full rounded-lg border border-[#D8DCE0] bg-white p-3 text-sm"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingEval}
                  className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-lg border border-[#23272E] bg-[#23272E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3A404B] transition-colors cursor-pointer"
                >
                  <UserCheck className="h-4 w-4 shrink-0" />
                  <span>
                    {isCorrectionMode
                      ? 'Guardar Corrección, Enseñar a IA y Aplicar Decisión'
                      : decision === 'Contratado'
                      ? 'Confirmar Contratación y Cubrir Vacante'
                      : 'Guardar Decisión del Jefe de RR.HH.'}
                  </span>
                </button>
              </form>
            </div>
          )}
        </section>
      </div>

      {/* Section 3: Learned Rules & HR Corrections */}
      <section className="rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-7">
        <div className="flex items-center gap-2 border-b border-[#E2E4E8] pb-4">
          <ClipboardCheck className="h-5 w-5 text-[#B26337]" />
          <div>
            <h2 className="text-lg font-bold text-[#23272E]">
              Criterios y Correcciones Enseñadas a la IA ({recruitmentCriteria.length})
            </h2>
            <p className="mt-0.5 text-sm text-[#5C626D]">
              La IA observa cada corrección del Jefe de RR.HH. y recalibra automáticamente el puntaje de los candidatos.
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#EFEFF1]">
          {recruitmentCriteria.map((crit) => (
            <div key={crit.id} className="py-4">
              <div className="text-xs text-[#5C626D]">
                {crit.isCorrection && (
                  <>
                    <span className="font-bold text-[#B26337]">Corrección Jefe RR.HH.</span>
                    <span aria-hidden="true"> · </span>
                  </>
                )}
                <span className="font-semibold text-[#23272E]">{crit.weightLabel}</span>
                <span aria-hidden="true"> · </span>
                <span>Área: {crit.appliesToDepartment}</span>
                <span aria-hidden="true"> · </span>
                <span className="font-mono-tabular">{crit.createdAt}</span>
              </div>
              <h3 className="mt-1 text-base font-bold text-[#23272E]">{crit.title}</h3>
              {crit.wrongAiAssumption && (
                <p className="mt-0.5 text-xs text-[#5C626D]">
                  Corrección aplicada sobre supuesto previo: “{crit.wrongAiAssumption}”
                </p>
              )}
              <p className="mt-0.5 text-sm text-[#23272E]">{crit.ruleText}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
