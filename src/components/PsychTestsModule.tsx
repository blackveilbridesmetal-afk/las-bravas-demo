import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  FileDown,
  Send,
} from 'lucide-react';
import type { Candidate } from '../types';
import { PsychRadarChart } from './ExecutiveCharts';

interface PsychTestsModuleProps {
  hrChiefName: string;
  candidates: Candidate[];
  initialCandidateId?: string | null;
  onSendPsychTest: (payload: {
    candidateId: string;
    testBatteryName: string;
  }) => Promise<void>;
  onSubmitPsychTest: (
    candidateId: string,
    answers: {
      estabilidad: number;
      tolerancia: number;
      seguridad: number;
      equipo: number;
      razonamiento: number;
    }
  ) => Promise<void>;
}

const BATTERIES = [
  'Batería Psicolaboral Minera 14x7 (HSEC + Altura)',
  'Evaluación Psicotécnica Supervisión Crítica HSEC',
  'Batería Psicolaboral Laboratorio y Turno 14x7',
  'Test de Toma de Decisiones y Trabajo en Equipo Mina',
];

export const PsychTestsModule: React.FC<PsychTestsModuleProps> = ({
  hrChiefName,
  candidates,
  initialCandidateId,
  onSendPsychTest,
  onSubmitPsychTest,
}) => {
  const [selectedCandId, setSelectedCandId] = useState<string>(
    initialCandidateId || candidates[0]?.id || ''
  );

  useEffect(() => {
    if (initialCandidateId) {
      setSelectedCandId(initialCandidateId);
    }
  }, [initialCandidateId]);

  const activeCand =
    candidates.find((c) => c.id === selectedCandId) ?? candidates[0] ?? null;

  const [batteryName, setBatteryName] = useState(BATTERIES[0]);
  const [sendFeedback, setSendFeedback] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Automated Test Runner (for applicant completion or HR simulation)
  const [showRunner, setShowRunner] = useState(false);
  const [ansEstabilidad, setAnsEstabilidad] = useState(5);
  const [ansTolerancia, setAnsTolerancia] = useState(4);
  const [ansSeguridad, setAnsSeguridad] = useState(5);
  const [ansEquipo, setAnsEquipo] = useState(4);
  const [ansRazonamiento, setAnsRazonamiento] = useState(4);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);
  const [testDoneNotice, setTestDoneNotice] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCand) return;
    setIsSending(true);
    setSendFeedback(null);
    try {
      await onSendPsychTest({
        candidateId: activeCand.id,
        testBatteryName: batteryName,
      });
      setSendFeedback(
        `Prueba "${batteryName}" enviada a ${activeCand.fullName} (Código: ${activeCand.psychEvaluation.accessCode}) por ${hrChiefName}.`
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleCompleteAutomatedTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCand) return;
    setIsSubmittingTest(true);
    setTestDoneNotice(null);
    try {
      await onSubmitPsychTest(activeCand.id, {
        estabilidad: ansEstabilidad,
        tolerancia: ansTolerancia,
        seguridad: ansSeguridad,
        equipo: ansEquipo,
        razonamiento: ansRazonamiento,
      });
      setShowRunner(false);
      setTestDoneNotice(
        `Resultados automáticos guardados para ${activeCand.fullName}. La IA observó la tabla y actualizó el reporte completo de puntuaciones del puesto.`
      );
    } finally {
      setIsSubmittingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Split: Send Automated Psych Test + Live Automated Runner */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <section
          aria-labelledby="send-psych-heading"
          className="rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-7 lg:col-span-5"
        >
          <div className="flex items-start gap-2.5 border-b border-[#E2E4E8] pb-4">
            <Send className="mt-0.5 h-5 w-5 shrink-0 text-[#B26337]" />
            <div>
              <h1 id="send-psych-heading" className="text-lg font-bold text-[#23272E]">
                Enviar Prueba Psicológica Automática
              </h1>
              <p className="mt-0.5 text-sm text-[#5C626D]">
                La encargada de RR.HH. envía la prueba desde la plataforma; al responderla, la IA procesa los resultados automáticamente.
              </p>
            </div>
          </div>

          <form onSubmit={handleSend} className="mt-4 space-y-4">
            <div>
              <label htmlFor="psych-cand" className="block text-xs font-semibold text-[#23272E]">
                Candidato destinatario
              </label>
              <select
                id="psych-cand"
                value={selectedCandId}
                onChange={(e) => {
                  setSelectedCandId(e.target.value);
                  setSendFeedback(null);
                  setTestDoneNotice(null);
                }}
                className="mt-1 w-full min-h-[44px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm text-[#23272E]"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} — {c.psychEvaluation.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="psych-battery" className="block text-xs font-semibold text-[#23272E]">
                Batería psicolaboral minera
              </label>
              <select
                id="psych-battery"
                value={batteryName}
                onChange={(e) => setBatteryName(e.target.value)}
                className="mt-1 w-full min-h-[44px] rounded-lg border border-[#D8DCE0] bg-white px-3 text-sm text-[#23272E]"
              >
                {BATTERIES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {sendFeedback && (
              <p role="status" className="rounded-lg border border-[#E6CDBE] bg-[#FBF4EE] px-3.5 py-2.5 text-xs font-medium text-[#8C4722]">
                {sendFeedback}
              </p>
            )}

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button
                type="submit"
                disabled={isSending || !activeCand}
                className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#B26337] px-4 py-2 text-sm font-semibold text-white hover:bg-[#99522B] transition-colors cursor-pointer"
              >
                <Send className="h-4 w-4 shrink-0" />
                <span>{isSending ? 'Enviando...' : 'Enviar Prueba por Plataforma'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRunner((v) => !v)}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-[#D8DCE0] bg-[#F7F7F8] px-4 py-2 text-xs sm:text-sm font-semibold text-[#23272E] hover:bg-[#EFEFF1] cursor-pointer"
              >
                <ClipboardList className="h-4 w-4 text-[#B26337] shrink-0" />
                <span>{showRunner ? 'Cerrar Test' : 'Responder Test'}</span>
              </button>
            </div>
          </form>

          {showRunner && activeCand && (
            <form
              onSubmit={handleCompleteAutomatedTest}
              className="mt-5 space-y-3 border-t border-[#E2E4E8] pt-4"
            >
              <p className="text-xs font-bold text-[#8C4722]">
                Cuestionario Automático ({activeCand.fullName} · Código {activeCand.psychEvaluation.accessCode})
              </p>

              {[
                {
                  id: 'q-est',
                  label: '1. Control emocional bajo presión operativa (1-5)',
                  val: ansEstabilidad,
                  set: setAnsEstabilidad,
                },
                {
                  id: 'q-tol',
                  label: '2. Adaptación a campamento remoto / altura 14x7 (1-5)',
                  val: ansTolerancia,
                  set: setAnsTolerancia,
                },
                {
                  id: 'q-seg',
                  label: '3. Cumplimiento estricto de normas HSEC (1-5)',
                  val: ansSeguridad,
                  set: setAnsSeguridad,
                },
                {
                  id: 'q-eq',
                  label: '4. Cooperación en cuadrilla y comunicación (1-5)',
                  val: ansEquipo,
                  set: setAnsEquipo,
                },
                {
                  id: 'q-raz',
                  label: '5. Razonamiento ante fallas en planta / frente (1-5)',
                  val: ansRazonamiento,
                  set: setAnsRazonamiento,
                },
              ].map((q) => (
                <div key={q.id} className="flex items-center justify-between gap-3">
                  <label htmlFor={q.id} className="text-xs text-[#23272E]">
                    {q.label}
                  </label>
                  <select
                    id={q.id}
                    value={q.val}
                    onChange={(e) => q.set(Number(e.target.value))}
                    className="min-h-[36px] rounded-lg border border-[#D8DCE0] bg-white px-2.5 font-mono-tabular text-xs font-semibold"
                  >
                    <option value={5}>5 - Muy Alto</option>
                    <option value={4}>4 - Alto</option>
                    <option value={3}>3 - Medio</option>
                    <option value={2}>2 - Bajo</option>
                    <option value={1}>1 - Muy Bajo</option>
                  </select>
                </div>
              ))}

              <button
                type="submit"
                disabled={isSubmittingTest}
                className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#23272E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3A404B] cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  {isSubmittingTest
                    ? 'Calculando puntuaciones IA...'
                    : 'Finalizar Prueba y Enviar Resultados a la IA'}
                </span>
              </button>
            </form>
          )}
        </section>

        {/* Right: AI Full Candidate Score Report based on Psych Table + Job Metrics */}
        <section
          aria-labelledby="ai-psych-report-heading"
          className="rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-7 lg:col-span-7"
        >
          {!activeCand ? (
            <p className="py-10 text-center text-sm text-[#5C626D]">
              Selecciona un candidato de la tabla.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E4E8] pb-4">
                <div className="flex items-start gap-2.5">
                  <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0 text-[#B26337]" />
                  <div>
                    <h2 id="ai-psych-report-heading" className="text-lg font-bold text-[#23272E]">
                      Reporte Integral de Puntuaciones IA — {activeCand.fullName}
                    </h2>
                    <p className="mt-0.5 text-xs text-[#5C626D]">
                      {activeCand.targetRoleTitle} · Código Psico:{' '}
                      <span className="font-mono-tabular">{activeCand.psychEvaluation.accessCode}</span>
                    </p>
                  </div>
                </div>
                <a
                  href={`/api/reports/candidate/${activeCand.id}/doc`}
                  download
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#B26337] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#99522B]"
                >
                  <FileDown className="h-3.5 w-3.5 shrink-0" />
                  <span>Descargar Reporte (.doc)</span>
                </a>
              </div>

              {testDoneNotice && (
                <p role="status" className="rounded-lg border border-[#D2E3D8] bg-[#F2F7F4] px-4 py-2.5 text-sm font-medium text-[#3D7A5A]">
                  {testDoneNotice}
                </p>
              )}

              {/* 5-Metric Consolidated Score Strip for the Position */}
              <div className="grid grid-cols-2 gap-4 border-b border-[#E2E4E8] pb-4 sm:grid-cols-5">
                {[
                  { label: 'Técnico / Specs', val: activeCand.metricReport.technicalSpecsScore, accent: false },
                  { label: 'Experiencia', val: activeCand.metricReport.experienceScore, accent: false },
                  { label: 'Formación', val: activeCand.metricReport.educationCareerScore, accent: false },
                  { label: 'Psicológico', val: activeCand.metricReport.psychScore, accent: true },
                ].map((m) => (
                  <div key={m.label}>
                    <p className="text-xs text-[#5C626D]">{m.label}</p>
                    <p className={`mt-0.5 font-mono-tabular text-xl font-bold ${m.accent ? 'text-[#B26337]' : 'text-[#23272E]'}`}>
                      {m.val}
                    </p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#EFEFF1]">
                      <div
                        className={`h-full rounded-full ${m.accent ? 'bg-[#B26337]' : 'bg-[#5C626D]'}`}
                        style={{ width: `${m.val}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div>
                  <p className="text-xs font-semibold text-[#8C4722]">Global Puesto</p>
                  <p className="mt-0.5 font-mono-tabular text-2xl font-bold text-[#B26337]">
                    {activeCand.metricReport.overallScore}/100
                  </p>
                </div>
              </div>

              {/* Psychometric 5-Axis Radar + AI Observation */}
              <div className="grid grid-cols-1 gap-5 rounded-lg border border-[#EFEFF1] bg-[#F7F7F8] p-4 sm:grid-cols-12 sm:items-center">
                {activeCand.psychEvaluation.scores ? (
                  <div className="sm:col-span-5">
                    <PsychRadarChart
                      axes={[
                        { label: 'Estabilidad', value: activeCand.psychEvaluation.scores.estabilidadEmocional },
                        { label: 'Altura 14x7', value: activeCand.psychEvaluation.scores.toleranciaFaenaAltura },
                        { label: 'HSEC', value: activeCand.psychEvaluation.scores.apegoSeguridadHSEC },
                        { label: 'Equipo', value: activeCand.psychEvaluation.scores.trabajoEquipo },
                        { label: 'Razonam.', value: activeCand.psychEvaluation.scores.razonamientoOperativo },
                      ]}
                    />
                  </div>
                ) : (
                  <div className="sm:col-span-5 rounded-lg border border-dashed border-[#D8DCE0] bg-white p-5 text-center text-xs text-[#5C626D]">
                    Gráfico psicométrico disponible en cuanto el postulante responda la prueba automática.
                  </div>
                )}

                <div className="space-y-3 text-sm text-[#23272E] sm:col-span-7">
                  <div>
                    <p className="text-xs font-bold text-[#8C4722]">
                      Observación IA sobre Tabla Psicológica ({activeCand.psychEvaluation.aptitudeLevel})
                    </p>
                    <p className="mt-1 leading-relaxed">{activeCand.psychEvaluation.aiPsychObservation}</p>
                  </div>
                  <div className="border-t border-[#E2E4E8] pt-3">
                    <p className="text-xs font-bold text-[#5C626D]">
                      Dictamen Completo del Puesto (listo para Gerencia)
                    </p>
                    <p className="mt-1 leading-relaxed">{activeCand.metricReport.aiDetailedReport}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Bottom: Full Psychometric Results Table Observed by AI */}
      <section
        aria-labelledby="psych-table-heading"
        className="rounded-xl border border-[#E2E4E8] bg-white p-5 sm:p-7"
      >
        <div className="flex flex-col gap-2 border-b border-[#E2E4E8] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="psych-table-heading" className="text-lg font-bold text-[#23272E]">
              Tabla de Resultados Psicológicos Automáticos (Observada por la IA)
            </h2>
            <p className="mt-0.5 text-sm text-[#5C626D]">
              Cada resultado completado recalcula automáticamente las puntuaciones del puesto y alimenta los documentos descargables.
            </p>
          </div>
          <a
            href="/api/reports/candidates-csv"
            download
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#D8DCE0] bg-[#F7F7F8] px-3 py-1.5 text-xs font-semibold text-[#23272E] hover:bg-[#EFEFF1]"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span>Exportar Tabla (.csv)</span>
          </a>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E2E4E8] text-xs font-semibold text-[#5C626D]">
                <th className="py-3 pr-4">Candidato</th>
                <th className="py-3 pr-4">Estado Prueba</th>
                <th className="py-3 pr-4 text-right">Estabilidad</th>
                <th className="py-3 pr-4 text-right">Tolerancia 14x7</th>
                <th className="py-3 pr-4 text-right">Seguridad HSEC</th>
                <th className="py-3 pr-4 text-right">Equipo</th>
                <th className="py-3 pr-4 text-right">Razonamiento</th>
                <th className="py-3 pr-4 text-right">Promedio Psico</th>
                <th className="py-3 text-right">Aptitud IA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEFF1]">
              {candidates.map((c) => {
                const s = c.psychEvaluation.scores;
                const isSelected = activeCand?.id === c.id;
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCandId(c.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#FBF4EE]' : 'hover:bg-[#F7F7F8]'
                    }`}
                  >
                    <td className="py-3 pr-4">
                      <p className="font-bold text-[#23272E]">{c.fullName}</p>
                      <p className="text-xs text-[#5C626D]">{c.targetRoleTitle}</p>
                    </td>
                    <td className="py-3 pr-4 text-xs font-semibold">
                      <span
                        className={
                          c.psychEvaluation.status === 'Completada'
                            ? 'text-[#3D7A5A]'
                            : c.psychEvaluation.status === 'Enviada'
                            ? 'text-[#8C4722]'
                            : 'text-[#5C626D]'
                        }
                      >
                        {c.psychEvaluation.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right font-mono-tabular">
                      {s ? s.estabilidadEmocional : '-'}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono-tabular">
                      {s ? s.toleranciaFaenaAltura : '-'}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono-tabular font-semibold">
                      {s ? s.apegoSeguridadHSEC : '-'}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono-tabular">
                      {s ? s.trabajoEquipo : '-'}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono-tabular">
                      {s ? s.razonamientoOperativo : '-'}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono-tabular font-bold text-[#B26337]">
                      {c.psychEvaluation.averageScore !== null
                        ? `${c.psychEvaluation.averageScore}/100`
                        : '-'}
                    </td>
                    <td className="py-3 text-right text-xs font-semibold text-[#23272E]">
                      {c.psychEvaluation.aptitudeLevel}
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
