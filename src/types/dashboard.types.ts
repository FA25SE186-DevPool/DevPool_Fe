// ==================== EXECUTIVE DASHBOARD ====================

export interface ExecutiveDashboardModel {
  // Overview Metrics
  totalProjects: number;
  activeProjects: number;
  totalTalents: number;
  activeAssignments: number;
  totalClients: number;
  totalPartners: number;

  // Financial Overview
  totalRevenue: number; // Total revenue from clients (VND)
  totalCosts: number; // Total costs to partners (VND)
  netProfit: number; // Revenue - Costs
  profitMargin: number; // (NetProfit / TotalRevenue) * 100

  // Revenue Breakdown
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowth: number; // Percentage change

  // Costs Breakdown
  costsThisMonth: number;
  costsLastMonth: number;
  costsGrowth: number; // Percentage change

  // Projects by Status
  projectsByStatus: Record<string, number>;

  // Assignments by Status
  assignmentsByStatus: Record<string, number>;

  // Revenue Trend (Last 6 months)
  revenueTrend: MonthlyRevenueModel[];

  // Top Clients (by revenue)
  topClients: TopClientModel[];

  // Top Projects (by revenue)
  topProjects: TopProjectModel[];

  // Payment Status
  pendingPayments: number; // Amount pending from clients
  overduePayments: number; // Amount overdue from clients
  paidThisMonth: number; // Amount paid this month
}

export interface MonthlyRevenueModel {
  year: number;
  month: number;
  monthLabel: string; // e.g., "Nov 2024"
  revenue: number;
  costs: number;
  profit: number;
}

export interface TopClientModel {
  clientId: number;
  clientName: string;
  totalRevenue: number;
  projectCount: number;
}

export interface TopProjectModel {
  projectId: number;
  projectName: string;
  clientName: string;
  totalRevenue: number;
  assignmentCount: number;
}

// ==================== FINANCIAL DASHBOARD ====================

export interface FinancialDashboardModel {
  // Revenue Metrics
  totalRevenue: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  averageMonthlyRevenue: number;

  // Cost Metrics
  totalCosts: number;
  costsThisMonth: number;
  costsThisYear: number;
  averageMonthlyCosts: number;

  // Profit Metrics
  netProfit: number;
  profitThisMonth: number;
  profitThisYear: number;
  profitMargin: number;

  // Payment Status
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  collectionRate: number; // (Paid / Invoiced) * 100

  // Revenue by Client
  revenueByClient: ClientRevenueModel[];

  // Revenue by Project
  revenueByProject: ProjectRevenueModel[];

  // Costs by Partner
  costsByPartner: PartnerCostModel[];

  // Monthly Financial Trend
  monthlyTrend: MonthlyFinancialModel[];

  // Payment Aging
  paymentAging: PaymentAgingModel[];

  // Currency Breakdown
  currencyBreakdown: CurrencyBreakdownModel[];
}

export interface ClientRevenueModel {
  clientId: number;
  clientName: string;
  totalRevenue: number;
  paidAmount: number;
  pendingAmount: number;
  contractCount: number;
}

export interface ProjectRevenueModel {
  projectId: number;
  projectName: string;
  clientName: string;
  totalRevenue: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface PartnerCostModel {
  partnerId: number;
  partnerName: string;
  totalCosts: number;
  paidAmount: number;
  contractCount: number;
}

export interface MonthlyFinancialModel {
  year: number;
  month: number;
  monthLabel: string;
  revenue: number;
  costs: number;
  profit: number;
  profitMargin: number;
}

export interface PaymentAgingModel {
  ageRange: string; // e.g., "0-30 days", "31-60 days", "61-90 days", "90+ days"
  amount: number;
  contractCount: number;
}

export interface CurrencyBreakdownModel {
  currencyCode: string;
  amount: number;
  amountVND: number;
  percentage: number;
}

// ==================== TALENT MANAGEMENT DASHBOARD ====================

export interface TalentManagementDashboardModel {
  // Overview Metrics
  totalTalents: number;
  activeTalents: number; // Status = "Working"
  availableTalents: number; // Status = "Available"
  onboardingTalents: number; // Status = "Onboarding"
  inactiveTalents: number; // Status = "Inactive"

  // Assignment Metrics
  totalAssignments: number;
  activeAssignments: number;
  draftAssignments: number;
  completedAssignments: number;
  terminatedAssignments: number;

  // Talent by Status
  talentsByStatus: Record<string, number>;

  // Talent by Working Mode
  talentsByWorkingMode: Record<string, number>;

  // Assignments by Status
  assignmentsByStatus: Record<string, number>;

  // Skill Distribution
  topSkills: SkillDistributionModel[];

  // Talent Utilization
  averageUtilizationRate: number; // Percentage of talents actively assigned
  talentUtilization: TalentUtilizationModel[];

  // New Talents (Last 3 months)
  newTalentsTrend: MonthlyTalentModel[];

  // Top Performing Talents
  topTalents: TopTalentModel[];

  // Talent Retention
  retentionRate: number; // Percentage of talents still active after 6 months
  talentsLeavingThisMonth: number;
  talentsJoiningThisMonth: number;

  // Assignment Duration
  averageAssignmentDuration: number; // Average days per assignment
  assignmentDurationDistribution: AssignmentDurationModel[];
}

export interface SkillDistributionModel {
  skillId: number;
  skillName: string;
  talentCount: number;
  percentage: number;
}

export interface TalentUtilizationModel {
  talentId: number;
  talentName: string;
  activeAssignments: number;
  utilizationRate: number; // Percentage
}

export interface MonthlyTalentModel {
  year: number;
  month: number;
  monthLabel: string;
  newTalents: number;
  leavingTalents: number;
  netChange: number;
}

export interface TopTalentModel {
  talentId: number;
  talentName: string;
  totalAssignments: number;
  activeAssignments: number;
  completedAssignments: number;
  averageRating: number; // If available
}

export interface AssignmentDurationModel {
  durationRange: string; // e.g., "0-3 months", "3-6 months", "6-12 months", "12+ months"
  assignmentCount: number;
  percentage: number;
}

// ==================== PROJECT & ASSIGNMENT DASHBOARD ====================

export interface ProjectAssignmentDashboardModel {
  // Project Metrics
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  plannedProjects: number;

  // Assignment Metrics
  totalAssignments: number;
  activeAssignments: number;
  draftAssignments: number;
  completedAssignments: number;

  // Projects by Status
  projectsByStatus: Record<string, number>;

  // Assignments by Status
  assignmentsByStatus: Record<string, number>;

  // Projects by Client
  projectsByClient: ClientProjectModel[];

  // Active Projects Details
  activeProjectsDetails: ActiveProjectModel[];

  // Assignment Distribution
  assignmentDistribution: AssignmentDistributionModel[];

  // Project Timeline
  projectTimeline: ProjectTimelineModel[];

  // Upcoming Deadlines
  upcomingDeadlines: UpcomingDeadlineModel[];

  // Project Health
  projectHealth: ProjectHealthModel[];

  // Resource Allocation
  resourceAllocation: ResourceAllocationModel[];
}

export interface ClientProjectModel {
  clientId: number;
  clientName: string;
  projectCount: number;
  activeProjectCount: number;
  assignmentCount: number;
}

export interface ActiveProjectModel {
  projectId: number;
  projectName: string;
  clientName: string;
  startDate: string;
  endDate?: string | null;
  status: string;
  assignmentCount: number;
  activeAssignmentCount: number;
}

export interface AssignmentDistributionModel {
  projectId: number;
  projectName: string;
  totalAssignments: number;
  activeAssignments: number;
  completedAssignments: number;
}

export interface ProjectTimelineModel {
  projectId: number;
  projectName: string;
  startDate: string;
  endDate?: string | null;
  expectedEndDate?: string | null;
  status: string;
  daysRemaining: number; // If end date is set
}

export interface UpcomingDeadlineModel {
  projectId: number;
  projectName: string;
  deadlineDate: string;
  deadlineType: string; // "End Date", "Expected End Date", etc.
  daysUntilDeadline: number;
}

export interface ProjectHealthModel {
  projectId: number;
  projectName: string;
  healthStatus: string; // "Healthy", "At Risk", "Critical"
  activeAssignments: number;
  completedAssignments: number;
  completionRate: number;
}

export interface ResourceAllocationModel {
  projectId: number;
  projectName: string;
  totalTalents: number;
  activeTalents: number;
  utilizationRate: number; // Percentage
}

// ==================== OPERATIONS DASHBOARD ====================

export interface OperationsDashboardModel {
  // Contract Status
  totalContracts: number;
  draftContracts: number;
  submittedContracts: number;
  verifiedContracts: number;
  approvedContracts: number;
  rejectedContracts: number;

  // Payment Status
  totalPayments: number;
  pendingPayments: number;
  processingPayments: number;
  invoicedPayments: number;
  partiallyPaidPayments: number;
  paidPayments: number;
  overduePayments: number;

  // Document Status
  totalDocuments: number;
  clientDocuments: number;
  partnerDocuments: number;

  // Workflow Metrics
  workflowStatus: WorkflowStatusModel[];

  // Pending Actions
  pendingActions: PendingActionModel[];

  // Contract Processing Time
  averageContractProcessingTime: number; // Average days from Draft to Approved
  contractProcessingTimes: ContractProcessingTimeModel[];

  // Payment Processing Time
  averagePaymentProcessingTime: number; // Average days from Invoiced to Paid
  paymentProcessingTimes: PaymentProcessingTimeModel[];

  // Bottlenecks
  bottlenecks: BottleneckModel[];

  // Recent Activities
  recentActivities: RecentActivityModel[];
}

export interface WorkflowStatusModel {
  workflowStage: string; // e.g., "Contract Verification", "Payment Processing"
  totalItems: number;
  pendingItems: number;
  completedItems: number;
  completionRate: number;
}

export interface PendingActionModel {
  actionType: string; // e.g., "Verify Contract", "Approve Contract", "Create Invoice"
  count: number;
  priority: string; // "High", "Medium", "Low"
}

export interface ContractProcessingTimeModel {
  contractId: number;
  contractNumber: string;
  processingDays: number;
  status: string;
}

export interface PaymentProcessingTimeModel {
  paymentId: number;
  paymentNumber: string;
  processingDays: number;
  status: string;
}

export interface BottleneckModel {
  stage: string;
  stuckItems: number;
  averageStuckDays: number;
  reason: string;
}

export interface RecentActivityModel {
  timestamp: string;
  activityType: string;
  description: string;
  userName: string;
}

// ==================== ANALYTICS & REPORTS ====================

export interface AnalyticsReportsModel {
  // Revenue Analytics
  revenueAnalytics: RevenueAnalyticsModel;

  // Cost Analytics
  costAnalytics: CostAnalyticsModel;

  // Talent Analytics
  talentAnalytics: TalentAnalyticsModel;

  // Project Analytics
  projectAnalytics: ProjectAnalyticsModel;

  // Trend Analysis
  trendAnalysis: TrendAnalysisModel[];

  // Forecasting
  forecasting: ForecastingModel;

  // Comparative Analysis
  comparativeAnalysis: ComparativeAnalysisModel;
}

export interface RevenueAnalyticsModel {
  totalRevenue: number;
  revenueGrowthRate: number; // Year-over-year growth
  averageRevenuePerProject: number;
  averageRevenuePerClient: number;
  revenueTrend: RevenueTrendModel[];
  revenueBySegment: RevenueSegmentModel[];
}

export interface CostAnalyticsModel {
  totalCosts: number;
  costGrowthRate: number;
  averageCostPerProject: number;
  averageCostPerPartner: number;
  costTrend: CostTrendModel[];
  costsBySegment: CostSegmentModel[];
}

export interface TalentAnalyticsModel {
  totalTalents: number;
  talentGrowthRate: number;
  averageAssignmentsPerTalent: number;
  averageAssignmentDuration: number;
  talentRetentionRate: number;
  talentTrend: TalentTrendModel[];
}

export interface ProjectAnalyticsModel {
  totalProjects: number;
  projectSuccessRate: number; // Percentage of completed projects
  averageProjectDuration: number;
  averageAssignmentsPerProject: number;
  projectTrend: ProjectTrendModel[];
}

export interface TrendAnalysisModel {
  metricName: string;
  trendDirection: string; // "Up", "Down", "Stable"
  trendPercentage: number;
  dataPoints: DataPointModel[];
}

export interface ForecastingModel {
  forecastedRevenueNextMonth: number;
  forecastedRevenueNextQuarter: number;
  forecastedRevenueNextYear: number;
  forecastedCostsNextMonth: number;
  forecastedCostsNextQuarter: number;
  forecastedCostsNextYear: number;
  forecastDataPoints: ForecastDataPointModel[];
}

export interface ComparativeAnalysisModel {
  periodComparison: PeriodComparisonModel[];
  clientComparison: ClientComparisonModel[];
  projectComparison: ProjectComparisonModel[];
}

// Supporting models
export interface RevenueTrendModel {
  year: number;
  month: number;
  revenue: number;
  growthRate: number;
}

export interface RevenueSegmentModel {
  segmentName: string; // e.g., "By Client", "By Project Type"
  revenue: number;
  percentage: number;
}

export interface CostTrendModel {
  year: number;
  month: number;
  costs: number;
  growthRate: number;
}

export interface CostSegmentModel {
  segmentName: string;
  costs: number;
  percentage: number;
}

export interface TalentTrendModel {
  year: number;
  month: number;
  talentCount: number;
  growthRate: number;
}

export interface ProjectTrendModel {
  year: number;
  month: number;
  projectCount: number;
  successRate: number;
}

export interface DataPointModel {
  date: string;
  value: number;
}

export interface ForecastDataPointModel {
  date: string;
  forecastedValue: number;
  actualValue?: number | null;
  confidenceLevel: number; // Percentage
}

export interface PeriodComparisonModel {
  periodName: string; // e.g., "This Month vs Last Month"
  currentValue: number;
  previousValue: number;
  change: number;
  changePercentage: number;
}

export interface ClientComparisonModel {
  clientId: number;
  clientName: string;
  revenue: number;
  costs: number;
  profit: number;
  profitMargin: number;
}

export interface ProjectComparisonModel {
  projectId: number;
  projectName: string;
  revenue: number;
  costs: number;
  profit: number;
  profitMargin: number;
  durationDays: number;
}

