import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import { ApplyActivityType, ApplyActivityStatus, type ApplyActivity, type ApplyActivityCreate, type ApplyActivityStatusUpdate, type ApplyActivityFilter } from "../types/applyactivity.types";

// Local types for advanced status update API
interface ApplyActivityAdvancedStatusUpdateModel {
    NewStatus: string;
    Notes?: string;
    CompletedDate?: string; // DateTime in ISO string format
}

export interface ApplyActivityStatusTransitionResult {
    success: boolean;
    message: string;
    oldStatus?: string;
    newStatus?: string;
    talentApplicationStatusUpdated: boolean;
    errors?: string[];
}

export { ApplyActivityType, ApplyActivityStatus };
export type { ApplyActivity, ApplyActivityCreate, ApplyActivityStatusUpdate, ApplyActivityFilter, ApplyActivityAdvancedStatusUpdateModel };

// Helper function to convert ApplyActivityStatus number to string name for API
export const getActivityStatusString = (status: ApplyActivityStatus): string => {
    const statusMap: Record<number, string> = {
        [ApplyActivityStatus.Scheduled]: "Scheduled",
        [ApplyActivityStatus.Completed]: "Completed",
        [ApplyActivityStatus.Passed]: "Passed",
        [ApplyActivityStatus.Failed]: "Failed",
        [ApplyActivityStatus.NoShow]: "NoShow"
    };
    return statusMap[status] || status.toString();
};


// eslint-disable-next-line react-refresh/only-export-components
export const applyActivityService = {
    async getAll(filter?: ApplyActivityFilter) {
        try {
            const params = new URLSearchParams();

            if (filter?.applyId) params.append("ApplyId", filter.applyId.toString());
            if (filter?.processStepId) params.append("ProcessStepId", filter.processStepId.toString());
            if (filter?.activityType !== undefined) params.append("ActivityType", filter.activityType.toString());
            if (filter?.status !== undefined) params.append("Status", filter.status.toString());
            if (filter?.scheduledDateFrom) params.append("ScheduledDateFrom", filter.scheduledDateFrom);
            if (filter?.scheduledDateTo) params.append("ScheduledDateTo", filter.scheduledDateTo);
            if (filter?.excludeDeleted !== undefined)
                params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");

            const url = `/applyactivity${params.toString() ? `?${params}` : ""}`;
            const response = await apiClient.get(url);

            return response.data as ApplyActivity[];
        } catch (error: unknown) {
            if (error instanceof AxiosError)
                throw error.response?.data || { message: "Cannot fetch apply activities" };
            throw { message: "Unknown error while fetching apply activities" };
        }
    },

    async getById(id: number) {
        try {
            const response = await apiClient.get(`/applyactivity/${id}`);
            return response.data as ApplyActivity;
        } catch (error: unknown) {
            if (error instanceof AxiosError)
                throw error.response?.data || { message: "Cannot fetch apply activity details" };
            throw { message: "Unknown error while fetching apply activity details" };
        }
    },

    async create(payload: ApplyActivityCreate) {
        try {
            const response = await apiClient.post("/applyactivity", payload);
            return response.data as ApplyActivity;
        } catch (error: unknown) {
            if (error instanceof AxiosError)
                throw error.response?.data || { message: "Cannot create apply activity" };
            throw { message: "Unknown error while creating apply activity" };
        }
    },

    async update(id: number, payload: Partial<ApplyActivityCreate> & { status?: ApplyActivityStatus }) {
        try {
            const response = await apiClient.put(`/applyactivity/${id}`, payload);
            return response.data as ApplyActivity;
        } catch (error: unknown) {
            if (error instanceof AxiosError)
                throw error.response?.data || { message: "Cannot update apply activity" };
            throw { message: "Unknown error while updating apply activity" };
        }
    },

    async updateStatus(id: number, payload: ApplyActivityStatusUpdate) {
        try {
            const response = await apiClient.patch(`/applyactivity/${id}/status`, payload);
            return response.data as ApplyActivity;
        } catch (error: unknown) {
            if (error instanceof AxiosError)
                throw error.response?.data || { message: "Cannot update apply activity status" };
            throw { message: "Unknown error while updating apply activity status" };
        }
    },

    async changeStatus(id: number, payload: ApplyActivityAdvancedStatusUpdateModel) {
        try {
            const response = await apiClient.patch(`/applyactivity/${id}/change-status`, payload);
            return response.data as ApplyActivityStatusTransitionResult;
        } catch (error: unknown) {
            if (error instanceof AxiosError)
                throw error.response?.data || { message: "Cannot change apply activity status" };
            throw { message: "Unknown error while changing apply activity status" };
        }
    },

    async delete(id: number) {
        try {
            const response = await apiClient.delete(`/applyactivity/${id}`);
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError)
                throw error.response?.data || { message: "Cannot delete apply activity" };
            throw { message: "Unknown error while deleting apply activity" };
        }
    },
};
