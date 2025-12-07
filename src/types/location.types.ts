export interface Location {
  id: number;
  name: string;
  code: string;
  description: string;
}

export interface LocationCreatePayload {
  name: string;
  code?: string;
  description?: string;
}

export interface LocationFilter {
  name?: string;
  code?: string;
  excludeDeleted?: boolean;
}

