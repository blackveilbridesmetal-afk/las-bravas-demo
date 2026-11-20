import type { AppStatePayload, Candidate, JobNeed, RecruitmentCriterion } from '../types';
import {
  computeCandidateScoreReport,
  evaluatePsychometricBattery,
  getTodayYYYYMMDD,
} from '../utils/recruitment';

function shiftDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return getTodayYYYYMMDD(d);
}

export function createInitialState(): AppStatePayload {
  const today = shiftDate(0);
  const yesterday = shiftDate(-1);
  const twoDaysAgo = shiftDate(-2);
  const fiveDaysAgo = shiftDate(-5);

  const jobNeeds: JobNeed[] = [
    {
      id: 'need-planta-1',
      title: 'Operador de Planta Concentradora Senior',
      department: 'Operaciones Mina',
      urgency: 'Urgente',
      vacancies: 3,
      filledCount: 1,
      requiredSkills: 'molienda, flotación, seguridad HSEC, trabajo en altura, turno 14x7',
      technicalSpecifications:
        'Experiencia >= 4 años en chancado y molienda SAG, Certificación HSEC vigente, aptitud médica altura > 4,200 msnm, Licencia A-IIb.',
      companyContext:
        'Ampliación de línea de molienda en Unidad Las Bravas; se requiere cobertura inmediata sin incidentes.',
      publishedBoards: ['Computrabajo Minería', 'Bumeran Perú', 'Portal Talento Las Bravas'],
      openedAt: shiftDate(-18),
      targetDaysToFill: 20,
      createdBy: 'Elena Vargas',
      status: 'Abierta',
    },
    {
      id: 'need-hsec-2',
      title: 'Ingeniero Supervisor de Seguridad HSEC',
      department: 'Seguridad HSEC',
      urgency: 'Urgente',
      vacancies: 2,
      filledCount: 1,
      requiredSkills: 'DS-024-2016-EM, IPERC, auditoría mina, liderazgo de cuadrillas',
      technicalSpecifications:
        'Titulado/Colegiado en Ing. de Minas o Seguridad Industrial, dominio de DS-024-2016-EM, 5+ años en tajo abierto o socavón.',
      companyContext:
        'Supervisión directa de contratistas y cumplimiento cero accidentes en frentes de explotación.',
      publishedBoards: ['LinkedIn Talento Minero', 'Computrabajo Minería', 'Bumeran Perú'],
      openedAt: shiftDate(-14),
      targetDaysToFill: 25,
      createdBy: 'Elena Vargas',
      status: 'Abierta',
    },
    {
      id: 'need-met-3',
      title: 'Analista de Laboratorio Metalúrgico',
      department: 'Control Metalúrgico',
      urgency: 'Media',
      vacancies: 2,
      filledCount: 1,
      requiredSkills: 'absorción atómica, leyes de cobre/oro, QA/QC, control de reactivos',
      technicalSpecifications:
        'Ingeniero Metalúrgico o Químico, manejo de espectrometría y balance metalúrgico, disponibilidad turno 14x7.',
      companyContext:
        'Asegurar trazabilidad horaria de recuperaciones metalúrgicas en laboratorio de unidad minera.',
      publishedBoards: ['LinkedIn Talento Minero', 'Indeed Operaciones', 'Referidos de Faena'],
      openedAt: shiftDate(-11),
      targetDaysToFill: 22,
      createdBy: 'Elena Vargas',
      status: 'Abierta',
    },
    {
      id: 'need-log-4',
      title: 'Coordinador de Bodega y Campamento Minero',
      department: 'Logística y Campamento',
      urgency: 'Planificada',
      vacancies: 2,
      filledCount: 1,
      requiredSkills: 'SAP MM, inventario crítico, despacho mina, control EPP',
      technicalSpecifications:
        'Carrera en Administración o Ing. Industrial, manejo de SAP MM / Excel avanzado, experiencia en almacenes remotos.',
      companyContext:
        'Renovación de stock estratégico de repuestos pesados y suministros para campamento Las Bravas.',
      publishedBoards: ['Computrabajo Minería', 'Portal Talento Las Bravas'],
      openedAt: shiftDate(-9),
      targetDaysToFill: 30,
      createdBy: 'Elena Vargas',
      status: 'Abierta',
    },
  ];

  const recruitmentCriteria: RecruitmentCriterion[] = [
    {
      id: 'rcrit-1',
      title: 'Priorizar experiencia comprobada en altura > 4,000 msnm y cultura HSEC',
      appliesToDepartment: 'Operaciones Mina',
      weightLabel: 'Prioritario',
      ruleText:
        'Valorar trayectoria real en faena minera sobre 4,000 msnm y cumplimiento HSEC por encima de postgrados teóricos.',
      isCorrection: true,
      wrongAiAssumption:
        'Inicialmente la IA redujo el puntaje de operarios técnicos experimentados frente a perfiles administrativos sin experiencia en altura.',
      learnedFromCandidate: 'Roberto Silva',
      createdBy: 'Elena Vargas',
      createdAt: fiveDaysAgo,
    },
    {
      id: 'rcrit-2',
      title: 'Exigir estabilidad emocional >= 75 para supervisión HSEC',
      appliesToDepartment: 'Seguridad HSEC',
      weightLabel: 'Prioritario',
      ruleText:
        'En puestos de supervisión de seguridad minera, la estabilidad emocional y apego a norma HSEC en la prueba psicológica son determinantes.',
      learnedFromCandidate: 'Lucía Fernández',
      createdBy: 'Elena Vargas',
      createdAt: twoDaysAgo,
    },
  ];

  const jobBoards = [
    {
      id: 'board-computrabajo',
      name: 'Computrabajo Minería',
      category: 'Bolsa Nacional' as const,
      proposalsSent: 9,
      candidatesReceived: 42,
      shortlistedCount: 14,
      hiredCount: 3,
      avgResponseHours: 6,
      lastProposalAt: yesterday,
      active: true,
    },
    {
      id: 'board-linkedin',
      name: 'LinkedIn Talento Minero',
      category: 'Red Profesional' as const,
      proposalsSent: 7,
      candidatesReceived: 28,
      shortlistedCount: 11,
      hiredCount: 2,
      avgResponseHours: 14,
      lastProposalAt: yesterday,
      active: true,
    },
    {
      id: 'board-bumeran',
      name: 'Bumeran Perú',
      category: 'Bolsa Nacional' as const,
      proposalsSent: 6,
      candidatesReceived: 23,
      shortlistedCount: 7,
      hiredCount: 1,
      avgResponseHours: 11,
      lastProposalAt: twoDaysAgo,
      active: true,
    },
    {
      id: 'board-referidos',
      name: 'Referidos de Faena',
      category: 'Referidos Faena' as const,
      proposalsSent: 4,
      candidatesReceived: 16,
      shortlistedCount: 8,
      hiredCount: 2,
      avgResponseHours: 4,
      lastProposalAt: twoDaysAgo,
      active: true,
    },
    {
      id: 'board-portal',
      name: 'Portal Talento Las Bravas',
      category: 'Portal Minero' as const,
      proposalsSent: 5,
      candidatesReceived: 14,
      shortlistedCount: 6,
      hiredCount: 1,
      avgResponseHours: 9,
      lastProposalAt: fiveDaysAgo,
      active: true,
    },
    {
      id: 'board-indeed',
      name: 'Indeed Operaciones',
      category: 'Bolsa Nacional' as const,
      proposalsSent: 3,
      candidatesReceived: 9,
      shortlistedCount: 2,
      hiredCount: 0,
      avgResponseHours: 18,
      lastProposalAt: fiveDaysAgo,
      active: true,
    },
  ];

  const psych1Scores = {
    estabilidadEmocional: 89,
    toleranciaFaenaAltura: 94,
    apegoSeguridadHSEC: 95,
    trabajoEquipo: 88,
    razonamientoOperativo: 86,
  };
  const psych1Eval = evaluatePsychometricBattery(psych1Scores);

  const psych2Scores = {
    estabilidadEmocional: 92,
    toleranciaFaenaAltura: 86,
    apegoSeguridadHSEC: 96,
    trabajoEquipo: 89,
    razonamientoOperativo: 91,
  };
  const psych2Eval = evaluatePsychometricBattery(psych2Scores);

  const psych3Scores = {
    estabilidadEmocional: 84,
    toleranciaFaenaAltura: 81,
    apegoSeguridadHSEC: 89,
    trabajoEquipo: 85,
    razonamientoOperativo: 92,
  };
  const psych3Eval = evaluatePsychometricBattery(psych3Scores);

  const psych4Scores = {
    estabilidadEmocional: 68,
    toleranciaFaenaAltura: 64,
    apegoSeguridadHSEC: 73,
    trabajoEquipo: 76,
    razonamientoOperativo: 74,
  };
  const psych4Eval = evaluatePsychometricBattery(psych4Scores);

  const rawCandidates: Array<Omit<Candidate, 'metricReport' | 'aiObservedScore' | 'aiProposedDecision' | 'aiAppliedCorrectionTitle' | 'aiSummary'>> = [
    {
      id: 'cand-roberto',
      fullName: 'Roberto Silva Huamán',
      age: 44,
      originLocation: 'Arequipa, Perú',
      university: 'TECSUP Arequipa',
      career: 'Operación de Plantas de Procesamiento de Minerales',
      yearsWorked: 11,
      workHistorySummary:
        '11 años como Operador Senior de molienda SAG y flotación en operaciones a 4,400 msnm.',
      specifications: [
        'Certificación HSEC vigente',
        'Trabajo en altura > 4,200 msnm',
        'Licencia A-IIb',
        'Molienda SAG y Flotación',
      ],
      phoneOrEmail: 'rsilva.mineria@correo.pe · +51 959 412 301',
      sourceBoardId: 'board-computrabajo',
      sourceBoardName: 'Computrabajo Minería',
      targetNeedId: 'need-planta-1',
      targetRoleTitle: 'Operador de Planta Concentradora Senior',
      interviewNotes:
        'Destacó en control de emergencias de chancado y liderazgo en turno 14x7.',
      psychEvaluation: {
        testBatteryName: 'Batería Psicolaboral Minera 14x7 (HSEC + Altura)',
        accessCode: 'BRV-PS-401',
        status: 'Completada',
        sentAt: fiveDaysAgo,
        sentBy: 'Elena Vargas',
        completedAt: twoDaysAgo,
        durationSeconds: 740,
        scores: psych1Scores,
        averageScore: psych1Eval.averageScore,
        aptitudeLevel: psych1Eval.aptitudeLevel,
        aiPsychObservation: psych1Eval.aiPsychObservation,
      },
      managerScore: null,
      decision: 'Pendiente de revisión',
      processDaysElapsed: 6,
      createdAt: fiveDaysAgo,
    },
    {
      id: 'cand-lucia',
      fullName: 'Lucía Fernández Quispe',
      age: 35,
      originLocation: 'Cajamarca, Perú',
      university: 'UNI - Universidad Nacional de Ingeniería',
      career: 'Ingeniería de Higiene y Seguridad Industrial',
      yearsWorked: 8,
      workHistorySummary:
        '8 años liderando sistemas IPERC, auditorías DS-024-2016-EM y respuesta a emergencias en tajo abierto.',
      specifications: [
        'Colegiada CIP',
        'Especialista DS-024-2016-EM',
        'Auditora ISO 45001',
        'Licencia A-IIa',
      ],
      phoneOrEmail: 'lucia.fernandez@correo.pe · +51 976 804 112',
      sourceBoardId: 'board-linkedin',
      sourceBoardName: 'LinkedIn Talento Minero',
      targetNeedId: 'need-hsec-2',
      targetRoleTitle: 'Ingeniero Supervisor de Seguridad HSEC',
      interviewNotes:
        'Excelente claridad normativa y firmeza para detener maniobras inseguras en frente de carga.',
      psychEvaluation: {
        testBatteryName: 'Evaluación Psicotécnica Supervisión Crítica HSEC',
        accessCode: 'BRV-PS-402',
        status: 'Completada',
        sentAt: fiveDaysAgo,
        sentBy: 'Elena Vargas',
        completedAt: yesterday,
        durationSeconds: 820,
        scores: psych2Scores,
        averageScore: psych2Eval.averageScore,
        aptitudeLevel: psych2Eval.aptitudeLevel,
        aiPsychObservation: psych2Eval.aiPsychObservation,
      },
      managerScore: 5,
      managerNotes: 'Perfil sólido en seguridad minera. Lista para terna final del Administrador.',
      decision: 'Preseleccionado',
      evaluatedBy: 'Elena Vargas',
      evaluatedAt: yesterday,
      processDaysElapsed: 8,
      createdAt: shiftDate(-8),
    },
    {
      id: 'cand-andres',
      fullName: 'Andrés Mamani Condori',
      age: 31,
      originLocation: 'Moquegua, Perú',
      university: 'UNSA - Universidad Nacional de San Agustín',
      career: 'Ingeniería Metalúrgica',
      yearsWorked: 6,
      workHistorySummary:
        '6 años en laboratorio químico-metalúrgico, absorción atómica y pruebas de flotación de cobre.',
      specifications: [
        'QA/QC Mineralógico',
        'Espectrometría AA',
        'Control de Reactivos',
        'Altura > 4,000 msnm',
      ],
      phoneOrEmail: 'amamani.met@correo.pe · +51 953 221 890',
      sourceBoardId: 'board-linkedin',
      sourceBoardName: 'LinkedIn Talento Minero',
      targetNeedId: 'need-met-3',
      targetRoleTitle: 'Analista de Laboratorio Metalúrgico',
      interviewNotes:
        'Dominio técnico sobresaliente en balances metalúrgicos y reportabilidad diaria.',
      psychEvaluation: {
        testBatteryName: 'Batería Psicolaboral Laboratorio y Turno 14x7',
        accessCode: 'BRV-PS-403',
        status: 'Completada',
        sentAt: twoDaysAgo,
        sentBy: 'Elena Vargas',
        completedAt: yesterday,
        durationSeconds: 690,
        scores: psych3Scores,
        averageScore: psych3Eval.averageScore,
        aptitudeLevel: psych3Eval.aptitudeLevel,
        aiPsychObservation: psych3Eval.aiPsychObservation,
      },
      managerScore: null,
      decision: 'Pendiente de revisión',
      processDaysElapsed: 5,
      createdAt: shiftDate(-5),
    },
    {
      id: 'cand-paola',
      fullName: 'Paola Mendoza Cáceres',
      age: 29,
      originLocation: 'Lima, Perú',
      university: 'PUCP - Pontificia Universidad Católica del Perú',
      career: 'Ingeniería Industrial',
      yearsWorked: 4,
      workHistorySummary:
        '4 años en cadena de suministro y gestión de almacenes con SAP MM en proyectos energéticos.',
      specifications: [
        'SAP MM Avanzado',
        'Gestión de Inventarios',
        'Excel / Power BI',
      ],
      phoneOrEmail: 'pmendoza.ind@correo.pe · +51 988 310 544',
      sourceBoardId: 'board-bumeran',
      sourceBoardName: 'Bumeran Perú',
      targetNeedId: 'need-log-4',
      targetRoleTitle: 'Coordinador de Bodega y Campamento Minero',
      interviewNotes:
        'Excelente dominio de SAP MM; validar adaptación a campamento remoto 14x7.',
      psychEvaluation: {
        testBatteryName: 'Batería Psicolaboral Minera 14x7 (HSEC + Altura)',
        accessCode: 'BRV-PS-404',
        status: 'Enviada',
        sentAt: yesterday,
        sentBy: 'Elena Vargas',
        scores: null,
        averageScore: null,
        aptitudeLevel: 'Pendiente',
        aiPsychObservation:
          'Prueba psicológica enviada por Elena Vargas. Esperando que la postulante complete el cuestionario automático.',
      },
      managerScore: null,
      decision: 'Pendiente de revisión',
      processDaysElapsed: 4,
      createdAt: shiftDate(-4),
    },
    {
      id: 'cand-jorge',
      fullName: 'Jorge Paredes Villalobos',
      age: 38,
      originLocation: 'Junín, Perú',
      university: 'Universidad Nacional del Centro del Perú',
      career: 'Ingeniería Mecánica',
      yearsWorked: 7,
      workHistorySummary:
        '7 años en mantenimiento y operación de chancadoras primarias y fajas transportadoras en sierra central.',
      specifications: [
        'Chancado Primario',
        'Certificación HSEC vigente',
        'Altura > 4,500 msnm',
      ],
      phoneOrEmail: 'jparedes.mec@correo.pe · +51 964 510 778',
      sourceBoardId: 'board-referidos',
      sourceBoardName: 'Referidos de Faena',
      targetNeedId: 'need-planta-1',
      targetRoleTitle: 'Operador de Planta Concentradora Senior',
      interviewNotes:
        'Recomendado por jefe de guardia; requiere reforzar calma bajo presión en situaciones límite.',
      psychEvaluation: {
        testBatteryName: 'Batería Psicolaboral Minera 14x7 (HSEC + Altura)',
        accessCode: 'BRV-PS-405',
        status: 'Completada',
        sentAt: shiftDate(-7),
        sentBy: 'Elena Vargas',
        completedAt: twoDaysAgo,
        durationSeconds: 860,
        scores: psych4Scores,
        averageScore: psych4Eval.averageScore,
        aptitudeLevel: psych4Eval.aptitudeLevel,
        aiPsychObservation: psych4Eval.aiPsychObservation,
      },
      managerScore: 3,
      managerNotes: 'Pasar a prueba práctica supervisada en chancado antes de decidir contratación.',
      decision: 'En prueba práctica',
      evaluatedBy: 'Elena Vargas',
      evaluatedAt: yesterday,
      processDaysElapsed: 10,
      createdAt: shiftDate(-10),
    },
    {
      id: 'cand-diego',
      fullName: 'Diego Salcedo Rojas',
      age: 27,
      originLocation: 'Cusco, Perú',
      university: 'Universidad Nacional de San Antonio Abad del Cusco',
      career: 'Ingeniería de Minas',
      yearsWorked: 3,
      workHistorySummary:
        '3 años como asistente de guardia y monitoreo de ventilación y seguridad en mina subterránea.',
      specifications: [
        'Licencia A-IIb',
        'IPERC Continuo',
        'Altura > 4,200 msnm',
      ],
      phoneOrEmail: 'dsalcedo.minas@correo.pe · +51 984 119 432',
      sourceBoardId: 'board-computrabajo',
      sourceBoardName: 'Computrabajo Minería',
      targetNeedId: 'need-hsec-2',
      targetRoleTitle: 'Ingeniero Supervisor de Seguridad HSEC',
      interviewNotes:
        'Buen potencial joven; falta enviarle su prueba psicológica automática desde la plataforma.',
      psychEvaluation: {
        testBatteryName: 'Evaluación Psicotécnica Supervisión Crítica HSEC',
        accessCode: 'BRV-PS-406',
        status: 'Sin enviar',
        scores: null,
        averageScore: null,
        aptitudeLevel: 'Pendiente',
        aiPsychObservation:
          'Aún no se ha enviado la prueba psicológica automática al postulante.',
      },
      managerScore: null,
      decision: 'Pendiente de revisión',
      processDaysElapsed: 3,
      createdAt: shiftDate(-3),
    },
  ];

  const candidates: Candidate[] = rawCandidates.map((cand) => {
    const need = jobNeeds.find((n) => n.id === cand.targetNeedId);
    const evalRes = computeCandidateScoreReport(cand, need, recruitmentCriteria);
    return {
      ...cand,
      ...evalRes,
    };
  });

  return {
    companyName: 'Compañía Minera Las Bravas',
    hrChiefName: 'Elena Vargas',
    hrChiefTitle: 'Jefe de Recursos Humanos',
    jobNeeds,
    jobBoards,
    candidates,
    recruitmentCriteria,
  };
}
