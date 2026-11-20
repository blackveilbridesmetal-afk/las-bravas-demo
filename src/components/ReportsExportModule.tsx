import React, { useEffect, useRef, useState } from 'react';
import {
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  HardDrive,
  Laptop,
  Printer,
  RotateCcw,
  Upload,
} from 'lucide-react';
import type {
  AppStatePayload,
  Candidate,
  DataCenterStatus,
  JobBoardChannel,
  JobNeed,
  RecruitmentKPIs,
} from '../types';
import { DonutGaugeChart, HorizontalDistributionBars } from './ExecutiveCharts';

interface ReportsExportModuleProps {
  companyName: string;
  hrChiefName: string;
  candidates: Candidate[];
  jobNeeds: JobNeed[];
  jobBoards: JobBoardChannel[];
  kpis: RecruitmentKPIs;
  onStateRestored: (nextState: AppStatePayload) => void;
}

export const ReportsExportModule: React.FC<ReportsExportModuleProps> = ({
  companyName,
  hrChiefName,
  candidates,
  jobNeeds,
  jobBoards,
  kpis,
  onStateRestored,
}) => {
  const [dcStatus, setDcStatus] = useState<DataCenterStatus | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    candidates[0]?.id ?? ''
  );
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadDataCenterStatus = async () => {
    try {
      const res = await fetch('/api/datacenter/status');
      if (res.ok) {
        const data = (await res.json()) as DataCenterStatus;
        setDcStatus(data);
      }
    } catch {
      // Ignored when offline
    }
  };

  useEffect(() => {
    void loadDataCenterStatus();
  }, [candidates.length, jobNeeds.length, kpis.psychCompletedCount]);

  const selectedCandidate =
    candidates.find((c) => c.id === selectedCandidateId) ?? candidates[0] ?? null;

  const originParam =
    typeof window !== 'undefined'
      ? encodeURIComponent(window.location.origin)
      : '';

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsRestoring(true);
    setRestoreMessage(null);
    setRestoreError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<AppStatePayload>;
      const res = await fetch('/api/datacenter/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || 'No se pudo restaurar el respaldo JSON.');
      }
      const data = (await res.json()) as { state: AppStatePayload };
      onStateRestored(data.state);
      setRestoreMessage('Respaldo del Data Center restaurado y sincronizado correctamente.');
      await loadDataCenterStatus();
    } catch (err) {
      setRestoreError(
        err instanceof Error ? err.message : 'Archivo JSON inválido para restauración.'
      );
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      {/* Executive Deliverables Section */}
      <section className="min-w-0 rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-4 border-b border-[#E2E4E8] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#23272E] sm:text-2xl">
              Centro de Documentos y Telemetría para el Administrador
            </h1>
            <p className="mt-1 text-sm text-[#5C626D]">
              Descarga informes ejecutivos listos para entregar en Word, tablas Excel con telemetría completa de candidatos, resultados psicológicos IA y KPIs de bolsas de trabajo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-[#D4D7DD] bg-white px-4 py-2 text-sm font-semibold text-[#23272E] hover:bg-[#EFEFF1] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="h-4 w-4 text-[#5C626D]" />
            <span>Imprimir / Guardar PDF</span>
          </button>
        </div>

        {/* Snapshot KPIs before download */}
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-[#E2E4E8] bg-[#F7F7F8] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#5C626D]">
              Candidatos en Base
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#23272E]">
              {kpis.totalCandidates}
            </p>
          </div>
          <div className="rounded-lg border border-[#E2E4E8] bg-[#F7F7F8] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#5C626D]">
              Cobertura Vacantes
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#B26337]">
              {kpis.coveragePercent}%
            </p>
          </div>
          <div className="rounded-lg border border-[#E2E4E8] bg-[#F7F7F8] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#5C626D]">
              Psicológicas Completas
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#23272E]">
              {kpis.psychCompletedCount} / {kpis.totalCandidates}
            </p>
          </div>
          <div className="rounded-lg border border-[#E2E4E8] bg-[#F7F7F8] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#5C626D]">
              Bolsa Líder
            </p>
            <p className="mt-1 truncate text-base font-bold text-[#23272E]" title={kpis.topBoardName}>
              {kpis.topBoardName}
            </p>
            <p className="text-xs tabular-nums text-[#5C626D]">
              {kpis.topBoardCandidates} postulantes
            </p>
          </div>
        </div>

        {/* Executive Visual Snapshot for General Manager */}
        <div className="mt-6 grid min-w-0 gap-5 rounded-xl border border-[#EFEFF1] bg-[#F7F7F8]/70 p-5 md:grid-cols-12">
          <div className="min-w-0 md:col-span-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#23272E]">
              Cobertura de Vacantes (Resumen Gerencial)
            </p>
            <DonutGaugeChart
              percent={kpis.coveragePercent}
              title="Cobertura de Vacantes"
              centerLabel={`${kpis.coveragePercent}%`}
              centerSublabel={`${kpis.filledVacancies}/${kpis.totalVacancies} plazas`}
              filledLabel={`${kpis.filledVacancies} cubiertas`}
              remainingLabel={`${kpis.remainingVacancies} pendientes`}
            />
          </div>
          <div className="min-w-0 border-t border-[#E2E4E8] pt-4 md:col-span-7 md:border-t-0 md:border-l md:pt-0 md:pl-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#23272E]">
              Top Candidatos por Índice Global IA (Listos para Gerencia)
            </p>
            <HorizontalDistributionBars
              items={[...candidates]
                .sort((a, b) => b.metricReport.overallScore - a.metricReport.overallScore)
                .slice(0, 4)
                .map((c, idx) => ({
                  label: `${c.fullName} — ${c.targetRoleTitle}`,
                  value: c.metricReport.overallScore,
                  sublabel: c.decision,
                  accent: idx < 2 ? 'orange' : 'plomo',
                }))}
              maxOverride={100}
              unitLabel="/100"
            />
          </div>
        </div>

        {/* Primary Download Cards */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="flex flex-col justify-between rounded-xl border border-[#E6CDBE] bg-[#FBF4EE] p-5">
            <div>
              <div className="flex items-center gap-2.5 text-[#8C4722]">
                <FileText className="h-5 w-5 shrink-0" />
                <h2 className="text-base font-bold text-[#23272E]">
                  Informe Ejecutivo Administrador
                </h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#5C626D]">
                Documento Word (.doc) estructurado con resumen gerencial de {companyName}, cobertura de vacantes, ranking de bolsas de trabajo, cuadro de puntuaciones IA y estado psicológico de cada candidato.
              </p>
            </div>
            <a
              href="/api/reports/admin-doc"
              download
              className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#B26337] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#99522B] transition-colors"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>Descargar Informe (.doc)</span>
            </a>
          </article>

          <article className="flex flex-col justify-between rounded-xl border border-[#E2E4E8] bg-white p-5">
            <div>
              <div className="flex items-center gap-2.5 text-[#23272E]">
                <FileSpreadsheet className="h-5 w-5 shrink-0 text-[#B26337]" />
                <h2 className="text-base font-bold text-[#23272E]">
                  Telemetría de Candidatos (.csv)
                </h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#5C626D]">
                Archivo compatible con Excel (UTF-8) con edad, procedencia, universidad, carrera, años trabajados, especificaciones, puntajes técnicos, 5 dimensiones psicológicas y decisión Jefe de RR.HH.
              </p>
            </div>
            <a
              href="/api/reports/candidates-csv"
              download
              className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-[#B26337] bg-white px-4 py-2.5 text-sm font-semibold text-[#8C4722] hover:bg-[#FBF4EE] transition-colors"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>Descargar Base Excel (.csv)</span>
            </a>
          </article>

          <article className="flex flex-col justify-between rounded-xl border border-[#E2E4E8] bg-white p-5">
            <div>
              <div className="flex items-center gap-2.5 text-[#23272E]">
                <FileSpreadsheet className="h-5 w-5 shrink-0 text-[#5C626D]" />
                <h2 className="text-base font-bold text-[#23272E]">
                  KPIs de Procesos y Bolsas (.csv)
                </h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#5C626D]">
                Reporte tabular descargable con cobertura por vacante minera, propuestas enviadas a cada bolsa de trabajo, candidatos aportados, preseleccionados, contratados y tiempos de respuesta.
              </p>
            </div>
            <a
              href="/api/reports/kpis-csv"
              download
              className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-[#D4D7DD] bg-[#F7F7F8] px-4 py-2.5 text-sm font-semibold text-[#23272E] hover:bg-[#EFEFF1] transition-colors"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>Descargar KPIs Excel (.csv)</span>
            </a>
          </article>
        </div>
      </section>

      {/* Individual Candidate Scorecard Download */}
      <section className="min-w-0 rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#23272E]">
              Ficha Individual Descargable por Candidato (.doc)
            </h2>
            <p className="mt-1 text-sm text-[#5C626D]">
              Selecciona cualquier postulante para generar su documento individual con métricas completas, observaciones de la prueba psicológica automática y veredicto de {hrChiefName}.
            </p>
          </div>
          {selectedCandidate && (
            <div className="flex w-full min-w-0 flex-wrap items-center gap-3 sm:w-auto">
              <select
                aria-label="Seleccionar candidato para descargar ficha"
                value={selectedCandidate.id}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="min-h-[42px] w-full max-w-full sm:w-auto rounded-lg border border-[#D4D7DD] bg-white px-3.5 py-2 text-sm text-[#23272E] focus:border-[#B26337] focus:outline-none"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} — {c.targetRoleTitle} ({c.metricReport.overallScore} pts)
                  </option>
                ))}
              </select>
              <a
                href={`/api/reports/candidate/${encodeURIComponent(selectedCandidate.id)}/doc`}
                download
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#B26337] px-4 py-2 text-sm font-semibold text-white hover:bg-[#99522B] transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="h-4 w-4 shrink-0" />
                <span>Descargar Ficha (.doc)</span>
              </a>
            </div>
          )}
        </div>

        {/* Compact Telemetry Preview Table */}
        <div className="mt-5 w-full overflow-x-auto rounded-lg border border-[#E2E4E8]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E2E4E8] bg-[#F7F7F8] text-xs uppercase tracking-wide text-[#5C626D]">
              <tr>
                <th className="px-4 py-3 font-semibold">Candidato</th>
                <th className="px-4 py-3 font-semibold">Puesto Objetivo</th>
                <th className="px-4 py-3 font-semibold text-right">Técnico</th>
                <th className="px-4 py-3 font-semibold text-right">Psicológico</th>
                <th className="px-4 py-3 font-semibold text-right">Global IA</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Archivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEFF1]">
              {candidates.map((cand) => (
                <tr key={cand.id} className="hover:bg-[#F7F7F8]/80">
                  <td className="px-4 py-3 font-semibold text-[#23272E]">
                    {cand.fullName}
                  </td>
                  <td className="px-4 py-3 text-[#5C626D]">{cand.targetRoleTitle}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#23272E]">
                    {cand.metricReport.technicalSpecsScore}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#23272E]">
                    {cand.psychEvaluation.averageScore ?? 'Pend.'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-[#B26337]">
                    {cand.metricReport.overallScore}/100
                  </td>
                  <td className="px-4 py-3 text-[#5C626D]">{cand.decision}</td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`/api/reports/candidate/${encodeURIComponent(cand.id)}/doc`}
                      download
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B26337] hover:text-[#99522B]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>.doc</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Local Data Center 24/7 & Windows 11 Kits */}
      <section className="rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-3 border-b border-[#E2E4E8] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <HardDrive className="h-5 w-5 text-[#B26337]" />
            <div>
              <h2 className="text-lg font-bold text-[#23272E]">
                Data Center Local Empresarial (PC 24/7) e Instalador Windows 11
              </h2>
              <p className="text-sm text-[#5C626D]">
                Respaldo directo en disco local sin depender de la nube externa y accesos directos para escritorio Windows 11.
              </p>
            </div>
          </div>
          {dcStatus && (
            <span className="text-xs font-medium tabular-nums text-[#5C626D]">
              Último guardado: {dcStatus.lastSavedAt}
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {/* Backup & Restore */}
          <div className="rounded-lg border border-[#E2E4E8] bg-[#F7F7F8] p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#23272E]">
              <Database className="h-4 w-4 text-[#B26337]" />
              <span>Estado de Persistencia Local ({dcStatus?.storagePath || 'data/store.json'})</span>
            </div>
            <p className="mt-2 text-sm text-[#5C626D]">
              Registros activos:{' '}
              <strong className="tabular-nums text-[#23272E]">
                {dcStatus?.totalRecords ??
                  candidates.length + jobNeeds.length + jobBoards.length}
              </strong>{' '}
              ({candidates.length} candidatos, {jobNeeds.length} vacantes,{' '}
              {jobBoards.length} bolsas de trabajo).
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/api/datacenter/backup"
                download
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#D4D7DD] bg-white px-4 py-2 text-sm font-semibold text-[#23272E] hover:bg-[#EFEFF1] transition-colors"
              >
                <Download className="h-4 w-4 text-[#B26337]" />
                <span>Exportar Respaldo (.json)</span>
              </a>

              <label className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-lg border border-[#D4D7DD] bg-white px-4 py-2 text-sm font-semibold text-[#23272E] hover:bg-[#EFEFF1] transition-colors">
                <Upload className="h-4 w-4 text-[#5C626D]" />
                <span>{isRestoring ? 'Restaurando...' : 'Restaurar Respaldo (.json)'}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleRestoreFile}
                  disabled={isRestoring}
                  className="sr-only"
                />
              </label>
            </div>

            {restoreMessage && (
              <p className="mt-3 text-xs font-semibold text-[#8C4722]">{restoreMessage}</p>
            )}
            {restoreError && (
              <p className="mt-3 text-xs font-semibold text-red-700">{restoreError}</p>
            )}
          </div>

          {/* Windows 11 & 24/7 PC Scripts */}
          <div className="rounded-lg border border-[#E2E4E8] bg-[#F7F7F8] p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#23272E]">
              <Laptop className="h-4 w-4 text-[#B26337]" />
              <span>Instalación en Laptop RR.HH. y Servidor Windows 11</span>
            </div>
            <p className="mt-2 text-sm text-[#5C626D]">
              Crea un acceso directo tipo aplicación de escritorio para la encargada de RR.HH. o prepara la computadora empresarial para operar 24/7 sin suspensión.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={`/api/download/windows-installer${originParam ? `?url=${originParam}` : ''}`}
                download
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#B26337] px-4 py-2 text-sm font-semibold text-white hover:bg-[#99522B] transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Instalador Windows 11 (.cmd)</span>
              </a>
              <a
                href={`/api/download/datacenter-kit${originParam ? `?url=${originParam}` : ''}`}
                download
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#D4D7DD] bg-white px-4 py-2 text-sm font-semibold text-[#23272E] hover:bg-[#EFEFF1] transition-colors"
              >
                <RotateCcw className="h-4 w-4 text-[#5C626D]" />
                <span>Kit Servidor 24/7 (.cmd)</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
