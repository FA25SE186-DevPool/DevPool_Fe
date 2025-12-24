import { useState, useCallback } from "react";
import { partnerService } from "../services/Partner";
import { talentService } from "../services/Talent";

export type EntityType = "partner" | "talent";

export interface EntityInfoData {
  id: string;
  name: string;
  type: EntityType;
  // Partner specific fields
  companyName?: string;
  partnerCode?: string;
  taxCode?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  // Talent specific fields
  fullName?: string;
  talentCode?: string;
  skills?: string[];
  experience?: number;
  location?: string;
  [key: string]: any;
}

export function useEntityInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [entityData, setEntityData] = useState<EntityInfoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntityInfo = useCallback(async (type: EntityType, id: string) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      let data: any;

      if (type === "partner") {
        data = await partnerService.getDetailedById(Number(id));
        // Handle response structure: { data: {...} } or direct data
        const partnerData = data?.data || data;
        setEntityData({
          id,
          name: partnerData?.companyName || partnerData?.name || "—",
          type: "partner",
          companyName: partnerData?.companyName,
          partnerCode: partnerData?.code,
          taxCode: partnerData?.taxCode,
          contactPerson: partnerData?.contactPerson,
          email: partnerData?.email,
          phone: partnerData?.phone,
          address: partnerData?.address,
          ...partnerData,
        });
      } else if (type === "talent") {
        data = await talentService.getById(Number(id));
        setEntityData({
          id,
          name: data?.fullName || data?.name || "—",
          type: "talent",
          fullName: data?.fullName,
          talentCode: data?.code,
          email: data?.email,
          phone: data?.phone,
          skills: data?.skills?.map((skill: any) => skill.name) || [],
          experience: data?.experienceYears,
          location: data?.location,
          ...data,
        });
      }
    } catch (err) {
      console.error(`❌ Lỗi tải thông tin ${type}:`, err);
      setError(`Không thể tải thông tin ${type}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const openEntityInfo = useCallback((type: EntityType, id: string) => {
    setIsOpen(true);
    fetchEntityInfo(type, id);
  }, [fetchEntityInfo]);

  const closeEntityInfo = useCallback(() => {
    setIsOpen(false);
    setEntityData(null);
    setError(null);
  }, []);

  return {
    isOpen,
    entityData,
    loading,
    error,
    openEntityInfo,
    closeEntityInfo,
  };
}
