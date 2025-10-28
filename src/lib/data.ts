export const qualityMetrics = [
  {
    title: 'Patient Satisfaction',
    value: '92.8%',
    change: '+1.2%',
    changeType: 'increase',
    description: 'Compared to last month',
  },
  {
    title: 'Compliance Rate',
    value: '98.5%',
    change: '+0.5%',
    changeType: 'increase',
    description: 'Regulatory adherence',
  },
  {
    title: 'Avg. Wait Time',
    value: '12.4 min',
    change: '-8.1%',
    changeType: 'decrease',
    description: 'Emergency department',
  },
  {
    title: 'Incident Reports',
    value: '4',
    change: '-20%',
    changeType: 'decrease',
    description: 'This week',
  },
];

export const overviewChartData = [
  { month: 'Jan', compliance: 97.2, satisfaction: 89 },
  { month: 'Feb', compliance: 97.5, satisfaction: 90 },
  { month: 'Mar', compliance: 98.1, satisfaction: 91 },
  { month: 'Apr', compliance: 97.8, satisfaction: 92 },
  { month: 'May', compliance: 98.5, satisfaction: 92.8 },
  { month: 'Jun', compliance: 98.2, satisfaction: 91.5 },
  { month: 'Jul', compliance: 98.6, satisfaction: 93 },
  { month: 'Aug', compliance: 98.8, satisfaction: 94 },
  { month: 'Sep', compliance: 98.5, satisfaction: 93.5 },
  { month: 'Oct', compliance: 98.7, satisfaction: 92.9 },
  { month: 'Nov', compliance: 98.9, satisfaction: 94.2 },
  { month: 'Dec', compliance: 99.1, satisfaction: 95 },
];

export const recentReportsData = [
  {
    id: 'REP-001',
    title: 'Q4 Patient Feedback Analysis',
    date: '2023-12-28',
    author: 'Dr. Smith',
    status: 'Completed',
  },
  {
    id: 'REP-002',
    title: 'Hygiene Protocol Adherence',
    date: '2024-01-15',
    author: 'Nurse Johnson',
    status: 'In Progress',
  },
  {
    id: 'REP-003',
    title: 'Medication Error Rate Review',
    date: '2024-01-20',
    author: 'Dr. Rodriguez',
    status: 'Completed',
  },
  {
    id: 'REP-004',
    title: 'Surgical Outcomes Q1 2024',
    date: '2024-02-05',
    author: 'Dr. Chen',
    status: 'Pending',
  },
];

export const alertsData = [
  {
    id: 'ALT-01',
    metric: 'Patient Satisfaction',
    condition: 'falls below 85%',
    status: 'Active',
  },
  {
    id: 'ALT-02',
    metric: 'Avg. Wait Time',
    condition: 'exceeds 20 minutes',
    status: 'Active',
  },
  {
    id: 'ALT-03',
    metric: 'Compliance Rate',
    condition: 'falls below 95%',
    status: 'Inactive',
  },
];

export const kpiList = [
    "Patient Satisfaction",
    "Compliance Rate",
    "Average Wait Time",
    "Incident Reports",
    "Readmission Rates",
    "Staff to Patient Ratio"
];
