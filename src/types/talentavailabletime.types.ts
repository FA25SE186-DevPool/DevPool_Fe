export interface TalentAvailableTime {
  id: number;
  talentId: number;
  startTime: string; // DateTime as ISO string
  endTime?: string; // DateTime as ISO string
  notes: string;
}

export interface TalentAvailableTimeFilter {
  talentId?: number;
  startTimeFrom?: string; // DateTime as ISO string
  startTimeTo?: string; // DateTime as ISO string
  excludeDeleted?: boolean;
}

export interface TalentAvailableTimeCreate {
  talentId: number;
  startTime: string; // DateTime as ISO string
  endTime?: string; // DateTime as ISO string
  notes: string;
}

