export type AppSection =
  | 'candidatos'
  | 'procesos'
  | 'vacantes'
  | 'psicologicas'
  | 'reportes';

export type JobUrgency = 'Urgente' | 'Media' | 'Planificada';

export type CandidateDecision =
  | 'Pendiente de revisión'
  | 'En prueba práctica'
  | 'Preseleccionado'
  | 'Contratado'
  | 'No apto';

export type PsychTestStatus = 'Sin enviar' | 'Enviada' | 'Completada';

export type PsychAptitudeLevel =
  | 'Pendiente'
  | 'Apto Recomendado'
  | 'Apto con Observación'
  | 'Requiere Entrevista';

export interface PsychTestScores {
  estabilidadEmocional: number; // 0 - 100
  toleranciaFaenaAltura: number; // 0 - 100
  apegoSeguridadHSEC: number; // 0 - 100
  trabajoEquipo: number; // 0 - 100
  razonamientoOperativo: number; // 0 - 100
}

export interface PsychEvaluation {
  testBatteryName: string;
  accessCode: string;
  status: PsychTestStatus;
  sentAt?: string;
  sentBy?: string;
  completedAt?: string;
  durationSeconds?: number;
  scores: PsychTestScores | null;
  averageScore: number | null;
  aptitudeLevel: PsychAptitudeLevel;
  aiPsychObservation: string;
}

export interface CandidateMetricReport {
  technicalSpecsScore: number; // 0 - 100
  experienceScore: number; // 0 - 100
  educationCareerScore: number; // 0 - 100
  psychScore: number; // 0 - 100 (or baseline if not yet taken)
  overallScore: number; // 0 - 100
  fitVerdict: string;
  aiDetailedReport: string;
  generatedAt: string;
}

export interface JobNeed {
  id: string;
  title: string;
  department: string;
  urgency: JobUrgency;
  vacancies: number;
  filledCount: number;
  requiredSkills: string;
  technicalSpecifications: string;
  companyContext: string;
  publishedBoards: string[];
  openedAt: string;
  targetDaysToFill: number;
  createdBy: string;
  status: 'Abierta' | 'Cubierta';
}

export interface JobBoardChannel {
  id: string;
  name: string;
  category: 'Portal Minero' | 'Red Profesional' | 'Bolsa Nacional' | 'Referidos Faena';
  proposalsSent: number;
  candidatesReceived: number;
  shortlistedCount: number;
  hiredCount: number;
  avgResponseHours: number;
  lastProposalAt: string;
  active: boolean;
}

export interface Candidate {
  id: string;
  fullName: string;
  age: number;
  originLocation: string; // De dónde viene
  university: string; // Universidad / Instituto
  career: string; // Carrera
  yearsWorked: number; // Tiempo trabajado en años
  workHistorySummary: string; // Detalle de experiencia previa
  specifications: string[]; // Especificaciones técnicas, licencias, HSEC, altura
  phoneOrEmail: string;
  sourceBoardId: string;
  sourceBoardName: string;
  targetNeedId: string;
  targetRoleTitle: string;
  interviewNotes: string;
  psychEvaluation: PsychEvaluation;
  metricReport: CandidateMetricReport;
  aiObservedScore: number; // 0 - 100
  aiProposedDecision: CandidateDecision;
  aiAppliedCorrectionTitle?: string;
  aiSummary: string;
  wasAiCorrected?: boolean;
  managerScore: number | null; // 1 - 5
  managerNotes?: string;
  decision: CandidateDecision;
  evaluatedBy?: string;
  evaluatedAt?: string;
  processDaysElapsed: number;
  createdAt: string;
}

export interface RecruitmentCriterion {
  id: string;
  title: string;
  appliesToDepartment: string;
  weightLabel: 'Prioritario' | 'Importante' | 'Deseable';
  ruleText: string;
  isCorrection?: boolean;
  wrongAiAssumption?: string;
  learnedFromCandidate?: string;
  createdBy: string;
  createdAt: string;
}

export interface RecruitmentKPIs {
  totalVacancies: number;
  filledVacancies: number;
  remainingVacancies: number;
  coveragePercent: number;
  totalCandidates: number;
  preselectedOrHired: number;
  psychCompletedCount: number;
  psychPendingCount: number;
  avgProcessDays: number;
  totalProposalsSent: number;
  topBoardName: string;
  topBoardCandidates: number;
  aiAgreementRate: number;
}

export interface DataCenterStatus {
  mode: string;
  storagePath: string;
  totalRecords: number;
  candidatesCount: number;
  vacanciesCount: number;
  boardsCount: number;
  criteriaCount: number;
  psychCompletedCount: number;
  lastSavedAt: string;
}

export interface AppStatePayload {
  companyName: string;
  hrChiefName: string;
  hrChiefTitle: string;
  jobNeeds: JobNeed[];
  jobBoards: JobBoardChannel[];
  candidates: Candidate[];
  recruitmentCriteria: RecruitmentCriterion[];
}
