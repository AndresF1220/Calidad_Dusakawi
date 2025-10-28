export const qualityMetrics = [
  {
    title: 'Satisfacción del Paciente',
    value: '92.8%',
    change: '+1.2%',
    changeType: 'increase',
    description: 'Comparado con el mes pasado',
  },
  {
    title: 'Tasa de Cumplimiento',
    value: '98.5%',
    change: '+0.5%',
    changeType: 'increase',
    description: 'Adherencia regulatoria',
  },
  {
    title: 'Tiempo de Espera Prom.',
    value: '12.4 min',
    change: '-8.1%',
    changeType: 'decrease',
    description: 'Departamento de emergencias',
  },
  {
    title: 'Informes de Incidentes',
    value: '4',
    change: '-20%',
    changeType: 'decrease',
    description: 'Esta semana',
  },
];

export const overviewChartData = [
    { month: 'Ene', compliance: 97.2, satisfaction: 89 },
    { month: 'Feb', compliance: 97.5, satisfaction: 90 },
    { month: 'Mar', compliance: 98.1, satisfaction: 91 },
    { month: 'Abr', compliance: 97.8, satisfaction: 92 },
    { month: 'May', compliance: 98.5, satisfaction: 92.8 },
    { month: 'Jun', compliance: 98.2, satisfaction: 91.5 },
    { month: 'Jul', compliance: 98.6, satisfaction: 93 },
    { month: 'Ago', compliance: 98.8, satisfaction: 94 },
    { month: 'Sep', compliance: 98.5, satisfaction: 93.5 },
    { month: 'Oct', compliance: 98.7, satisfaction: 92.9 },
    { month: 'Nov', compliance: 98.9, satisfaction: 94.2 },
    { month: 'Dic', compliance: 99.1, satisfaction: 95 },
];

export const recentReportsData = [
  {
    id: 'REP-001',
    title: 'Análisis de Feedback de Pacientes Q4',
    date: '2023-12-28',
    author: 'Dr. Smith',
    status: 'Completado',
  },
  {
    id: 'REP-002',
    title: 'Adherencia a Protocolos de Higiene',
    date: '2024-01-15',
    author: 'Enfermera Johnson',
    status: 'En Progreso',
  },
  {
    id: 'REP-003',
    title: 'Revisión de Tasa de Errores de Medicación',
    date: '2024-01-20',
    author: 'Dra. Rodriguez',
    status: 'Completado',
  },
  {
    id: 'REP-004',
    title: 'Resultados Quirúrgicos Q1 2024',
    date: '2024-02-05',
    author: 'Dr. Chen',
    status: 'Pendiente',
  },
];

export const alertsData = [
  {
    id: 'ALT-01',
    metric: 'Satisfacción del Paciente',
    condition: 'cae por debajo del 85%',
    status: 'Activa',
  },
  {
    id: 'ALT-02',
    metric: 'Tiempo de Espera Prom.',
    condition: 'supera los 20 minutos',
    status: 'Activa',
  },
  {
    id: 'ALT-03',
    metric: 'Tasa de Cumplimiento',
    condition: 'cae por debajo del 95%',
    status: 'Inactiva',
  },
];

export const kpiList = [
    "Satisfacción del Paciente",
    "Tasa de Cumplimiento",
    "Tiempo de Espera Promedio",
    "Reportes de Incidentes",
    "Tasas de Readmisión",
    "Ratio Personal/Paciente"
];
