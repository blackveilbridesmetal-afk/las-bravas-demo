import React, { useMemo, useState } from 'react';
import { FileDown, Send, TrendingUp } from 'lucide-react';
import type { JobBoardChannel, JobNeed, RecruitmentKPIs } from '../types';
import { DonutGaugeChart, GroupedBoardsChart } from './ExecutiveCharts';

interface ProcessesKPIModuleProps {
  jobNeeds: JobNeed[];
  jobBoards: JobBoardChannel[];
  kpis: RecruitmentKPIs;
  onSendToJobBoard: (payload: { boardId: string; needId: string }) => Promise<void>;
}

export const ProcessesKPIModule: React.FC<ProcessesKPIModuleProps> = ({
  jobNeeds,
  jobBoards,
  kpis,
  onSendToJobBoard,
}) => {
  const [selectedNeedId, setSelectedNeedId] = useState(jobNeeds[0]?.id ?? '');
  const [selectedBoardId, setSelectedBoardId] = useState(jobBoards[0]?.id ?? '');
  const [dispatchNotice, setDispatchNotice] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const rankedBoards = useMemo(
    () => [...jobBoards].sort((a, b) => b.candidatesReceived - a.candidatesReceived),
    [jobBoards]
  );

  const maxCandidatesFromBoard = Math.max(
    1,
    rankedBoards[0]?.candidatesReceived ?? 1
  );

  const handleDispatchProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNeedId || !selectedBoardId) return;
    setIsSending(true);
    setDispatchNotice(null);
    try {
      await onSendToJobBoard({ boardId: selectedBoardId, needId: selectedNeedId });
      const boardName = jobBoards.find((b) => b.id === selectedBoardId)?.name;
      const needTitle = jobNeeds.find((n) => n.id === selectedNeedId)?.title;
      setDispatchNotice(
        `Propuesta de "${needTitle}" enviada a ${boardName}. Conteo de propuestas actualizado.`
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Summary Strip */}
      <section className="rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-4 border-b border-[#E2E4E8] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#23272E] sm:text-2xl">
              KPIs de Procesos, Cobertura de Vacantes y Bolsas de Trabajo
            </h1>
            <p className="mt-1 text-sm text-[#5C626D]">
              Control de avance de vacantes, canales donde se envían propuestas y ranking de bolsas que más candidatos aportan a Las Bravas.
            </p>
          </div>
          <a
            href="/api/reports/kpis-csv"
            download
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#D8DCE0] bg-[#F7F7F8] px-4 py-2 text-xs sm:text-sm font-semibold text-[#23272E] hover:bg-[#EFEFF1] transition-colors whitespace-nowrap shrink-0"
          >
            <FileDown className="h-4 w-4 text-[#5C626D] shrink-0" />
            <span>Descargar KPIs y Bolsas (.csv)</span>
          </a>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-[#5C626D]">Cobertura de Vacantes</p>
            <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#B26337]">
              {kpis.coveragePercent}%
            </p>
            <p className="text-xs text-[#5C626D] font-mono-tabular">
              {kpis.filledVacancies} de {kpis.totalVacancies} plazas
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#5C626D]">Propuestas Enviadas</p>
            <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#23272E]">
              {kpis.totalProposalsSent}
            </p>
            <p className="text-xs text-[#5C626D]">En {jobBoards.length} bolsas activas</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#5C626D]">Tiempo Promedio Proceso</p>
            <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#23272E]">
              {kpis.avgProcessDays} días
            </p>
            <p className="text-xs text-[#5C626D]">Acuerdo IA/RR.HH.: {kpis.aiAgreementRate}%</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#5C626D]">Bolsa Líder en Postulantes</p>
            <p className="mt-1 text-lg font-bold text-[#23272E] truncate">
              {kpis.topBoardName}
            </p>
            <p className="text-xs font-mono-tabular font-semibold text-[#B26337]">
              {kpis.topBoardCandidates} candidatos enviados
            </p>
          </div>
        </div>
      </section>

      {/* Executive Visual Analytics Row: Coverage Gauge + Job Board Comparison Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="min-w-0 rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-6 lg:col-span-4">
          <div className="border-b border-[#E2E4E8] pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#23272E]">
              Cobertura Global de Plazas
            </h2>
            <p className="mt-0.5 text-xs text-[#5C626D]">
              Avance consolidado frente a vacantes abiertas.
            </p>
          </div>
          <div className="mt-5">
            <DonutGaugeChart
              percent={kpis.coveragePercent}
              title="Cobertura Global de Vacantes"
              centerLabel={`${kpis.coveragePercent}%`}
              centerSublabel={`${kpis.filledVacancies}/${kpis.totalVacancies} plazas`}
              filledLabel={`${kpis.filledVacancies} cubiertas`}
              remainingLabel={`${kpis.remainingVacancies} pendientes`}
            />
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-6 lg:col-span-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E2E4E8] pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#23272E]">
                Rendimiento Comparativo por Bolsa de Trabajo
              </h2>
              <p className="mt-0.5 text-xs text-[#5C626D]">
                Propuestas enviadas frente a candidatos recibidos y preseleccionados por la IA.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <GroupedBoardsChart
              data={rankedBoards.map((b) => ({
                name: b.name,
                proposals: b.proposalsSent,
                candidates: b.candidatesReceived,
                shortlisted: b.shortlistedCount,
              }))}
            />
          </div>
        </section>
      </div>

      {/* Split: Job Boards Ranking + Send Proposal Dispatch */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <section
          aria-labelledby="boards-ranking-heading"
          className="rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-7 lg:col-span-8"
        >
          <div className="flex items-center gap-2 border-b border-[#E2E4E8] pb-4">
            <TrendingUp className="h-5 w-5 text-[#B26337]" />
            <div>
              <h2 id="boards-ranking-heading" className="text-lg font-bold text-[#23272E]">
                Bolsas de Trabajo: Propuestas Enviadas vs Trabajadores Recibidos
              </h2>
              <p className="mt-0.5 text-sm text-[#5C626D]">
                Ordenadas de mayor a menor según cuántos candidatos han enviado a Compañía Minera Las Bravas.
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-[#EFEFF1]">
            {rankedBoards.map((board, idx) => {
              const barPct = Math.round(
                (board.candidatesReceived / maxCandidatesFromBoard) * 100
              );
              const conversion =
                board.candidatesReceived > 0
                  ? Math.round((board.shortlistedCount / board.candidatesReceived) * 100)
                  : 0;

              return (
                <div key={board.id} className="py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono-tabular text-xs font-bold text-[#5C626D]">
                        0{idx + 1}.
                      </span>
                      <h3 className="text-base font-bold text-[#23272E]">{board.name}</h3>
                      <span className="text-xs text-[#5C626D]">· {board.category}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 font-mono-tabular text-xs">
                      <span className="text-[#5C626D]">
                        Propuestas: <strong className="text-[#23272E]">{board.proposalsSent}</strong>
                      </span>
                      <span className="text-[#5C626D]">
                        Candidatos: <strong className="text-[#B26337]">{board.candidatesReceived}</strong>
                      </span>
                      <span className="text-[#5C626D]">
                        Preselección: <strong className="text-[#23272E]">{conversion}%</strong>
                      </span>
                      <span className="text-[#5C626D]">
                        Contratados: <strong className="text-[#3D7A5A]">{board.hiredCount}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Muted opaque orange & plomo proportional bar */}
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#EFEFF1]">
                    <div
                      className="h-full rounded-full bg-[#C97A4B] transition-all duration-300"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Dispatch New Recruitment Proposal to Job Board */}
        <section
          aria-labelledby="dispatch-board-heading"
          className="rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-7 lg:col-span-4"
        >
          <h2 id="dispatch-board-heading" className="border-b border-[#E2E4E8] pb-4 text-lg font-bold text-[#23272E]">
            Enviar Propuesta a Bolsa de Trabajo
          </h2>
          <p className="mt-2 text-sm text-[#5C626D]">
            Publica una vacante hacia una bolsa externa o interna y registra su telemetría de envío.
          </p>

          <form onSubmit={handleDispatchProposal} className="mt-4 space-y-4">
            <div>
              <label htmlFor="dispatch-need" className="block text-xs font-semibold text-[#23272E]">
                Vacante a publicar
              </label>
              <select
                id="dispatch-need"
                value={selectedNeedId}
                onChange={(e) => setSelectedNeedId(e.target.value)}
                className="mt-1 w-full min-h-[44px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm text-[#23272E]"
              >
                {jobNeeds.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dispatch-board" className="block text-xs font-semibold text-[#23272E]">
                Bolsa de trabajo destino
              </label>
              <select
                id="dispatch-board"
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
                className="mt-1 w-full min-h-[44px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm text-[#23272E]"
              >
                {jobBoards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.candidatesReceived} candidatos)
                  </option>
                ))}
              </select>
            </div>

            {dispatchNotice && (
              <p role="status" className="rounded-lg border border-[#E6CDBE] bg-[#FBF4EE] px-3.5 py-2.5 text-xs font-medium text-[#8C4722]">
                {dispatchNotice}
              </p>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-lg bg-[#B26337] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#99522B] transition-colors cursor-pointer"
            >
              <Send className="h-4 w-4 shrink-0" />
              <span>{isSending ? 'Enviando propuesta...' : 'Enviar Propuesta a Bolsa'}</span>
            </button>
          </form>
        </section>
      </div>

      {/* Vacancy Coverage Breakdown */}
      <section
        aria-labelledby="coverage-table-heading"
        className="rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-7"
      >
        <h2 id="coverage-table-heading" className="border-b border-[#E2E4E8] pb-4 text-lg font-bold text-[#23272E]">
          Cobertura por Vacante en Compañía Minera Las Bravas
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E2E4E8] text-xs font-semibold text-[#5C626D]">
                <th className="py-3 pr-4">Puesto / Vacante</th>
                <th className="py-3 pr-4">Área Minera</th>
                <th className="py-3 pr-4">Urgencia</th>
                <th className="py-3 pr-4">Bolsas Publicadas</th>
                <th className="py-3 pr-4 text-right">Cubiertas / Req.</th>
                <th className="py-3 text-right">Avance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEFF1]">
              {jobNeeds.map((need) => {
                const pct =
                  need.vacancies > 0
                    ? Math.round((need.filledCount / need.vacancies) * 100)
                    : 0;
                return (
                  <tr key={need.id} className="hover:bg-[#F7F7F8]">
                    <td className="py-3.5 pr-4 font-semibold text-[#23272E]">
                      {need.title}
                    </td>
                    <td className="py-3.5 pr-4 text-[#5C626D]">{need.department}</td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`text-xs font-semibold ${
                          need.urgency === 'Urgente'
                            ? 'text-[#A84444]'
                            : need.urgency === 'Media'
                            ? 'text-[#8C4722]'
                            : 'text-[#5C626D]'
                        }`}
                      >
                        {need.urgency}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-[#5C626D]">
                      {need.publishedBoards.join(' · ')}
                    </td>
                    <td className="py-3.5 pr-4 text-right font-mono-tabular font-semibold text-[#23272E]">
                      {need.filledCount}/{need.vacancies}
                    </td>
                    <td className="py-3.5 text-right font-mono-tabular font-bold text-[#B26337]">
                      {pct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
