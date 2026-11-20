import React, { useMemo, useState } from 'react';
import {
  BrainCircuit,
  FileDown,
  Search,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import type {
  AppSection,
  Candidate,
  JobBoardChannel,
  JobNeed,
  RecruitmentKPIs,
} from '../types';
import { HorizontalDistributionBars } from './ExecutiveCharts';

interface CandidatesDashboardProps {
  candidates: Candidate[];
  jobNeeds: JobNeed[];
  jobBoards: JobBoardChannel[];
  kpis: RecruitmentKPIs;
  onAddCandidate: (payload: {
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
  }) => Promise<void>;
  onNavigate: (section: AppSection, candidateId?: string) => void;
}

export const CandidatesDashboard: React.FC<CandidatesDashboardProps> = ({
  candidates,
  jobNeeds,
  jobBoards,
  kpis,
  onAddCandidate,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNeedId, setFilterNeedId] = useState('all');
  const [filterBoardId, setFilterBoardId] = useState('all');
  const [filterDecision, setFilterDecision] = useState('all');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    candidates[0]?.id ?? ''
  );
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create candidate form fields
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('32');
  const [originLocation, setOriginLocation] = useState('Arequipa, Perú');
  const [university, setUniversity] = useState('');
  const [career, setCareer] = useState('');
  const [yearsWorked, setYearsWorked] = useState('5');
  const [specifications, setSpecifications] = useState('');
  const [workHistorySummary, setWorkHistorySummary] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [targetNeedId, setTargetNeedId] = useState(jobNeeds[0]?.id ?? '');
  const [sourceBoardId, setSourceBoardId] = useState(jobBoards[0]?.id ?? '');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCandidates = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return candidates.filter((c) => {
      if (filterNeedId !== 'all' && c.targetNeedId !== filterNeedId) return false;
      if (filterBoardId !== 'all' && c.sourceBoardId !== filterBoardId) return false;
      if (filterDecision !== 'all' && c.decision !== filterDecision) return false;
      if (!q) return true;
      const blob = `${c.fullName} ${c.originLocation} ${c.university} ${c.career} ${c.specifications.join(' ')} ${c.targetRoleTitle}`.toLowerCase();
      return blob.includes(q);
    });
  }, [candidates, searchTerm, filterNeedId, filterBoardId, filterDecision]);

  const activeCandidate =
    filteredCandidates.find((c) => c.id === selectedCandidateId) ??
    filteredCandidates[0] ??
    null;

  const avgGlobalScore = useMemo(() => {
    if (candidates.length === 0) return 0;
    return Math.round(
      candidates.reduce((sum, c) => sum + c.metricReport.overallScore, 0) / candidates.length
    );
  }, [candidates]);

  const executiveSummary = useMemo(() => {
    const avgAge =
      candidates.length > 0
        ? Math.round(candidates.reduce((s, c) => s + c.age, 0) / candidates.length)
        : 0;
    const avgYears =
      candidates.length > 0
        ? (
            candidates.reduce((s, c) => s + c.yearsWorked, 0) / candidates.length
          ).toFixed(1)
        : '0';

    const funnel = [
      {
        label: 'Preseleccionado / Contratado',
        value: candidates.filter(
          (c) => c.decision === 'Preseleccionado' || c.decision === 'Contratado'
        ).length,
        accent: 'sage' as const,
      },
      {
        label: 'En prueba práctica / técnica',
        value: candidates.filter((c) => c.decision === 'En prueba práctica').length,
        accent: 'orange' as const,
      },
      {
        label: 'Pendiente revisión Jefe RR.HH.',
        value: candidates.filter((c) => c.decision === 'Pendiente de revisión').length,
        accent: 'plomo' as const,
      },
      {
        label: 'No apto',
        value: candidates.filter((c) => c.decision === 'No apto').length,
        accent: 'plomo' as const,
      },
    ];

    const byOrigin = Object.entries(
      candidates.reduce<Record<string, number>>((acc, c) => {
        acc[c.sourceBoardName] = (acc[c.sourceBoardName] ?? 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], idx) => ({
        label,
        value,
        sublabel: `${candidates.length > 0 ? Math.round((value / candidates.length) * 100) : 0}%`,
        accent: (idx === 0 ? 'orange' : 'plomo') as 'orange' | 'plomo',
      }));

    return { avgAge, avgYears, funnel, byOrigin };
  }, [candidates]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!fullName.trim() || !career.trim()) {
      setFormError('Ingresa al menos el nombre completo y la carrera del postulante.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onAddCandidate({
        fullName: fullName.trim(),
        age: Number(age) || 30,
        originLocation: originLocation.trim() || 'Arequipa, Perú',
        university: university.trim() || 'Instituto / Universidad Técnica',
        career: career.trim(),
        yearsWorked: Number(yearsWorked) || 2,
        workHistorySummary: workHistorySummary.trim(),
        specifications: specifications.trim(),
        phoneOrEmail: phoneOrEmail.trim(),
        sourceBoardId: sourceBoardId || jobBoards[0]?.id || '',
        targetNeedId: targetNeedId || jobNeeds[0]?.id || '',
        interviewNotes: interviewNotes.trim(),
      });
      setFullName('');
      setUniversity('');
      setCareer('');
      setSpecifications('');
      setWorkHistorySummary('');
      setPhoneOrEmail('');
      setInterviewNotes('');
      setShowCreateForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo registrar al postulante.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Minimalist Header + 4-Column Tabular KPI Strip */}
      <section className="rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-4 border-b border-[#E2E4E8] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#23272E] sm:text-2xl">
              Dashboard de Candidatos y Métricas Completas
            </h1>
            <p className="mt-1 text-sm text-[#5C626D]">
              Consolidado integral de edad, procedencia, universidad, carrera, años trabajados, especificaciones técnicas y puntajes IA.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href="/api/reports/candidates-csv"
              download
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#D8DCE0] bg-[#F7F7F8] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#23272E] hover:bg-[#EFEFF1] transition-colors whitespace-nowrap"
            >
              <FileDown className="h-4 w-4 text-[#5C626D] shrink-0" />
              <span>Exportar Excel (.csv)</span>
            </a>
            <button
              type="button"
              onClick={() => setShowCreateForm((v) => !v)}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#B26337] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#99522B] transition-colors whitespace-nowrap cursor-pointer"
            >
              {showCreateForm ? (
                <>
                  <X className="h-4 w-4 shrink-0" />
                  <span>Cerrar Registro</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 shrink-0" />
                  <span>Nuevo Candidato</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-[#5C626D]">Candidatos en cartera</p>
            <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#23272E]">
              {candidates.length}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#5C626D]">Preseleccionados / Contratados</p>
            <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#B26337]">
              {kpis.preselectedOrHired}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#5C626D]">Psicológicas completadas</p>
            <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#23272E]">
              {kpis.psychCompletedCount}/{candidates.length}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#5C626D]">Índice promedio IA</p>
            <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#23272E]">
              {avgGlobalScore}/100
            </p>
          </div>
        </div>
      </section>

      {/* Executive Visual Summary for Management */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="min-w-0 rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-6 lg:col-span-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E2E4E8] pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#23272E]">
              Embudo de Selección y Calidad de Cartera
            </h2>
            <span className="font-mono-tabular text-xs text-[#5C626D]">
              Edad prom. {executiveSummary.avgAge} años · Exp. {executiveSummary.avgYears} años
            </span>
          </div>
          <div className="mt-4">
            <HorizontalDistributionBars
              items={executiveSummary.funnel}
              maxOverride={Math.max(1, candidates.length)}
              unitLabel=" cand."
            />
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-6 lg:col-span-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E2E4E8] pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#23272E]">
              Cartera Actual por Canal / Bolsa de Origen
            </h2>
            <span className="font-mono-tabular text-xs text-[#5C626D]">
              {candidates.length} evaluados
            </span>
          </div>
          <div className="mt-4">
            <HorizontalDistributionBars
              items={executiveSummary.byOrigin}
              maxOverride={Math.max(1, candidates.length)}
              unitLabel=" post."
            />
          </div>
        </section>
      </div>

      {/* Register Candidate Drawer/Section */}
      {showCreateForm && (
        <section
          aria-labelledby="create-cand-title"
          className="rounded-xl border border-[#E6CDBE] bg-[#FBF4EE] p-5 sm:p-7"
        >
          <div className="border-b border-[#E6CDBE] pb-3">
            <h2 id="create-cand-title" className="text-lg font-bold text-[#23272E]">
              Registrar Postulante con Métricas Completas
            </h2>
            <p className="mt-0.5 text-sm text-[#5C626D]">
              Al guardar, la IA calcula automáticamente la afinidad técnica, experiencia, formación y actualiza la bolsa de origen.
            </p>
          </div>

          <form onSubmit={handleCreate} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-12">
            {formError && (
              <p role="alert" className="sm:col-span-12 text-sm font-semibold text-[#A84444]">
                {formError}
              </p>
            )}
            <div className="sm:col-span-4">
              <label htmlFor="cand-name" className="block text-xs font-semibold text-[#23272E]">
                Nombre completo
              </label>
              <input
                id="cand-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Marco Antonio Quispe"
                className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm text-[#23272E] focus:border-[#B26337] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="cand-age" className="block text-xs font-semibold text-[#23272E]">
                Edad
              </label>
              <input
                id="cand-age"
                type="number"
                min={18}
                max={75}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 font-mono-tabular text-sm text-[#23272E] focus:border-[#B26337] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="cand-origin" className="block text-xs font-semibold text-[#23272E]">
                De dónde viene (Procedencia)
              </label>
              <input
                id="cand-origin"
                type="text"
                value={originLocation}
                onChange={(e) => setOriginLocation(e.target.value)}
                placeholder="Ej: Arequipa, Perú"
                className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm text-[#23272E] focus:border-[#B26337] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="cand-years" className="block text-xs font-semibold text-[#23272E]">
                Tiempo trabajado (años)
              </label>
              <input
                id="cand-years"
                type="number"
                min={0}
                max={45}
                value={yearsWorked}
                onChange={(e) => setYearsWorked(e.target.value)}
                className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 font-mono-tabular text-sm text-[#23272E] focus:border-[#B26337] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="cand-uni" className="block text-xs font-semibold text-[#23272E]">
                Universidad / Instituto
              </label>
              <input
                id="cand-uni"
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Ej: UNSA / TECSUP"
                className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm text-[#23272E] focus:border-[#B26337] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-4">
              <label htmlFor="cand-career" className="block text-xs font-semibold text-[#23272E]">
                Carrera / Especialidad
              </label>
              <input
                id="cand-career"
                type="text"
                required
                value={career}
                onChange={(e) => setCareer(e.target.value)}
                placeholder="Ej: Ingeniería Metalúrgica"
                className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm text-[#23272E] focus:border-[#B26337] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-4">
              <label htmlFor="cand-contact" className="block text-xs font-semibold text-[#23272E]">
                Correo / Teléfono
              </label>
              <input
                id="cand-contact"
                type="text"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                placeholder="Ej: +51 958 201 440"
                className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm text-[#23272E] focus:border-[#B26337] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="cand-need" className="block text-xs font-semibold text-[#23272E]">
                Vacante a la que postula
              </label>
              <select
                id="cand-need"
                value={targetNeedId}
                onChange={(e) => setTargetNeedId(e.target.value)}
                className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm text-[#23272E]"
              >
                {jobNeeds.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title} ({n.department})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-6">
              <label htmlFor="cand-board" className="block text-xs font-semibold text-[#23272E]">
                Bolsa de trabajo de procedencia
              </label>
              <select
                id="cand-board"
                value={sourceBoardId}
                onChange={(e) => setSourceBoardId(e.target.value)}
                className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm text-[#23272E]"
              >
                {jobBoards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="cand-specs" className="block text-xs font-semibold text-[#23272E]">
                Especificaciones técnicas (separadas por coma)
              </label>
              <input
                id="cand-specs"
                type="text"
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                placeholder="Ej: Certificación HSEC, Altura > 4200 msnm, Licencia A-IIb"
                className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm text-[#23272E]"
              />
            </div>
            <div className="sm:col-span-6">
              <label htmlFor="cand-history" className="block text-xs font-semibold text-[#23272E]">
                Resumen de trayectoria laboral
              </label>
              <input
                id="cand-history"
                type="text"
                value={workHistorySummary}
                onChange={(e) => setWorkHistorySummary(e.target.value)}
                placeholder="Ej: 5 años en planta concentradora y mantenimiento mecánico"
                className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm text-[#23272E]"
              />
            </div>

            <div className="sm:col-span-9">
              <label htmlFor="cand-notes" className="block text-xs font-semibold text-[#23272E]">
                Observación de entrevista inicial (opcional)
              </label>
              <input
                id="cand-notes"
                type="text"
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                placeholder="Ej: Disponibilidad inmediata para turno 14x7 en Unidad Las Bravas"
                className="mt-1 w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm text-[#23272E]"
              />
            </div>
            <div className="sm:col-span-3 flex items-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[42px] rounded-lg bg-[#B26337] px-4 py-2 text-sm font-semibold text-white hover:bg-[#99522B] transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Evaluando...' : 'Guardar y Evaluar IA'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filter Bar + Full Candidate Metrics Table */}
      <section className="rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-3 border-b border-[#E2E4E8] pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C626D]" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar candidato por nombre, universidad, carrera o ciudad"
              placeholder="Buscar nombre, universidad, carrera, procedencia..."
              className="w-full min-h-[42px] rounded-lg border border-[#D8DCE0] bg-[#F7F7F8] pl-9 pr-3 text-sm text-[#23272E] placeholder:text-[#5C626D] focus:border-[#B26337] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex w-full min-w-0 flex-wrap items-center gap-2.5 lg:w-auto">
            <select
              aria-label="Filtrar por vacante"
              value={filterNeedId}
              onChange={(e) => setFilterNeedId(e.target.value)}
              className="min-h-[40px] w-full max-w-full sm:w-auto rounded-lg border border-[#D8DCE0] bg-white px-3 text-xs sm:text-sm text-[#23272E]"
            >
              <option value="all">Todas las vacantes</option>
              {jobNeeds.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtrar por bolsa de trabajo"
              value={filterBoardId}
              onChange={(e) => setFilterBoardId(e.target.value)}
              className="min-h-[40px] w-full max-w-full sm:w-auto rounded-lg border border-[#D8DCE0] bg-white px-3 text-xs sm:text-sm text-[#23272E]"
            >
              <option value="all">Todas las bolsas</option>
              {jobBoards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtrar por estado"
              value={filterDecision}
              onChange={(e) => setFilterDecision(e.target.value)}
              className="min-h-[40px] w-full max-w-full sm:w-auto rounded-lg border border-[#D8DCE0] bg-white px-3 text-xs sm:text-sm text-[#23272E]"
            >
              <option value="all">Todos los estados</option>
              <option value="Pendiente de revisión">Pendiente de revisión</option>
              <option value="En prueba práctica">En prueba práctica</option>
              <option value="Preseleccionado">Preseleccionado</option>
              <option value="Contratado">Contratado</option>
              <option value="No apto">No apto</option>
            </select>
          </div>
        </div>

        {/* Minimalist Ordered Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E2E4E8] text-xs font-semibold text-[#5C626D]">
                <th className="py-3 pr-4">Candidato / Puesto</th>
                <th className="py-3 pr-4">Edad · Procedencia</th>
                <th className="py-3 pr-4">Universidad y Carrera</th>
                <th className="py-3 pr-4">Tiempo y Especificaciones</th>
                <th className="py-3 pr-4">Bolsa Origen</th>
                <th className="py-3 pr-4 text-right">Psicológico</th>
                <th className="py-3 pr-4 text-right">Global IA</th>
                <th className="py-3 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEFF1]">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-[#5C626D]">
                    No hay candidatos que coincidan con el filtro aplicado.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((cand) => {
                  const isSelected = activeCandidate?.id === cand.id;
                  return (
                    <tr
                      key={cand.id}
                      onClick={() => setSelectedCandidateId(cand.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#FBF4EE]' : 'hover:bg-[#F7F7F8]'
                      }`}
                    >
                      <td className="py-3.5 pr-4 align-top">
                        <button
                          type="button"
                          onClick={() => setSelectedCandidateId(cand.id)}
                          className="text-left font-bold text-[#23272E] hover:text-[#B26337] cursor-pointer"
                        >
                          {cand.fullName}
                        </button>
                        <p className="text-xs text-[#5C626D]">{cand.targetRoleTitle}</p>
                      </td>
                      <td className="py-3.5 pr-4 align-top">
                        <span className="font-mono-tabular font-semibold text-[#23272E]">
                          {cand.age} años
                        </span>
                        <p className="text-xs text-[#5C626D]">{cand.originLocation}</p>
                      </td>
                      <td className="py-3.5 pr-4 align-top max-w-[230px]">
                        <p className="font-medium text-[#23272E]">{cand.university}</p>
                        <p className="text-xs text-[#5C626D]">{cand.career}</p>
                      </td>
                      <td className="py-3.5 pr-4 align-top max-w-[250px]">
                        <span className="font-mono-tabular font-semibold text-[#23272E]">
                          {cand.yearsWorked} años trabajados
                        </span>
                        <p className="mt-0.5 text-xs text-[#5C626D]">
                          {cand.specifications.join(' · ')}
                        </p>
                      </td>
                      <td className="py-3.5 pr-4 align-top text-xs font-medium text-[#5C626D]">
                        {cand.sourceBoardName}
                      </td>
                      <td className="py-3.5 pr-4 align-top text-right font-mono-tabular">
                        {cand.psychEvaluation.averageScore !== null ? (
                          <div>
                            <span className="font-bold text-[#23272E]">
                              {cand.psychEvaluation.averageScore}/100
                            </span>
                            <p className="text-[11px] text-[#5C626D]">
                              {cand.psychEvaluation.aptitudeLevel}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-[#A6752B] font-medium">
                            {cand.psychEvaluation.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4 align-top text-right font-mono-tabular">
                        <span className="text-base font-bold text-[#B26337]">
                          {cand.metricReport.overallScore}/100
                        </span>
                      </td>
                      <td className="py-3.5 align-top text-right">
                        <span
                          className={`text-xs font-semibold ${
                            cand.decision === 'Contratado' ||
                            cand.decision === 'Preseleccionado'
                              ? 'text-[#3D7A5A]'
                              : cand.decision === 'No apto'
                              ? 'text-[#A84444]'
                              : 'text-[#8C4722]'
                          }`}
                        >
                          {cand.decision}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detailed Candidate Metric Report Panel (Deliverable to Admin) */}
      {activeCandidate && (
        <section
          aria-labelledby="candidate-detail-heading"
          className="rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-7"
        >
          <div className="flex flex-col gap-4 border-b border-[#E2E4E8] pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-medium text-[#5C626D]">
                Ficha Técnica y Reporte IA · {activeCandidate.originLocation} ·{' '}
                <span className="font-mono-tabular">{activeCandidate.age} años</span> · Bolsa:{' '}
                {activeCandidate.sourceBoardName}
              </p>
              <h2 id="candidate-detail-heading" className="mt-1 text-xl font-bold text-[#23272E]">
                {activeCandidate.fullName} — {activeCandidate.targetRoleTitle}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                href={`/api/reports/candidate/${activeCandidate.id}/doc`}
                download
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#B26337] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#99522B] transition-colors whitespace-nowrap"
              >
                <FileDown className="h-4 w-4 shrink-0" />
                <span>Descargar Ficha Word (.doc)</span>
              </a>
              <button
                type="button"
                onClick={() => onNavigate('psicologicas', activeCandidate.id)}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#D8DCE0] bg-[#F7F7F8] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#23272E] hover:bg-[#EFEFF1] transition-colors whitespace-nowrap cursor-pointer"
              >
                <BrainCircuit className="h-4 w-4 text-[#B26337] shrink-0" />
                <span>Ver Psicológica IA</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('vacantes', activeCandidate.id)}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#E6CDBE] bg-[#FBF4EE] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#8C4722] hover:bg-[#F4E7DC] transition-colors whitespace-nowrap cursor-pointer"
              >
                <UserCheck className="h-4 w-4 shrink-0" />
                <span>Aprobar / Corregir</span>
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left: Complete Profile Specifications */}
            <div className="space-y-3 text-sm text-[#23272E] lg:col-span-6">
              <p>
                <strong className="text-[#5C626D]">Universidad / Instituto:</strong>{' '}
                {activeCandidate.university}
              </p>
              <p>
                <strong className="text-[#5C626D]">Carrera:</strong> {activeCandidate.career}
              </p>
              <p>
                <strong className="text-[#5C626D]">Tiempo trabajado:</strong>{' '}
                <span className="font-mono-tabular font-semibold">
                  {activeCandidate.yearsWorked} años
                </span>{' '}
                — {activeCandidate.workHistorySummary}
              </p>
              <p>
                <strong className="text-[#5C626D]">Especificaciones técnicas:</strong>{' '}
                {activeCandidate.specifications.join(' · ')}
              </p>
              <p>
                <strong className="text-[#5C626D]">Contacto:</strong>{' '}
                {activeCandidate.phoneOrEmail}
              </p>
              <p>
                <strong className="text-[#5C626D]">Notas de entrevista:</strong>{' '}
                {activeCandidate.interviewNotes}
              </p>
            </div>

            {/* Right: AI Full Metric Scorecard */}
            <div className="space-y-4 lg:col-span-6">
              <div className="grid grid-cols-2 gap-4 border-b border-[#E2E4E8] pb-4 sm:grid-cols-4">
                {[
                  { label: 'Técnico', val: activeCandidate.metricReport.technicalSpecsScore, color: 'bg-[#23272E]' },
                  { label: 'Experiencia', val: activeCandidate.metricReport.experienceScore, color: 'bg-[#5C626D]' },
                  { label: 'Formación', val: activeCandidate.metricReport.educationCareerScore, color: 'bg-[#7A818D]' },
                  { label: 'Psicológico', val: activeCandidate.metricReport.psychScore, color: 'bg-[#B26337]' },
                ].map((m) => (
                  <div key={m.label}>
                    <p className="text-xs text-[#5C626D]">{m.label}</p>
                    <p className="font-mono-tabular text-lg font-bold text-[#23272E]">
                      {m.val}/100
                    </p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EFEFF1]">
                      <div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-[#F7F7F8] p-4 text-sm text-[#23272E]">
                <p className="text-xs font-bold text-[#8C4722]">
                  {activeCandidate.metricReport.fitVerdict} · Índice Global{' '}
                  <span className="font-mono-tabular">
                    {activeCandidate.metricReport.overallScore}/100
                  </span>
                </p>
                <p className="mt-1.5 leading-relaxed text-[#23272E]">
                  {activeCandidate.metricReport.aiDetailedReport}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
