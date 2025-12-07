export const ApplyActivityType = {
    Online: 0,
    Offline: 1,
} as const;

export type ApplyActivityType = typeof ApplyActivityType[keyof typeof ApplyActivityType];

export const ApplyActivityStatus = {
    Scheduled: 0,
    Completed: 1,
    Passed: 2,
    Failed: 3,
    NoShow: 4,
};

export type ApplyActivityStatus = number;

export interface ApplyActivity {
    id: number;
    applyId: number;
    processStepId: number;
    activityType: ApplyActivityType;
    scheduledDate?: string;
    status: ApplyActivityStatus;
    notes: string;
}

export interface ApplyActivityCreate {
    applyId: number;
    processStepId: number;
    activityType: ApplyActivityType;
    scheduledDate?: string;
    status: ApplyActivityStatus;
    notes?: string;
}

export interface ApplyActivityStatusUpdate {
    status: ApplyActivityStatus;
    notes?: string;
}

export interface ApplyActivityFilter {
    applyId?: number;
    processStepId?: number;
    activityType?: ApplyActivityType;
    status?: ApplyActivityStatus;
    scheduledDateFrom?: string;
    scheduledDateTo?: string;
    excludeDeleted?: boolean;
}

