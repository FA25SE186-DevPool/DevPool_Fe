import { useState, useEffect, useCallback } from 'react';
import { talentService, type Talent, type TalentFilter, type TalentWithRelatedDataCreateModel, type CreateDeveloperAccountModel } from '../services/Talent';
import { getErrorMessage } from '../utils/helpers';

interface UseTalentsOptions {
  autoFetch?: boolean;
  filter?: TalentFilter;
}

interface UseTalentsReturn {
  talents: Talent[];
  myManagedTalents: Talent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refetchMyManaged: () => Promise<void>;
  createTalent: (data: TalentWithRelatedDataCreateModel) => Promise<Talent | null>;
  updateTalent: (id: number, data: Partial<TalentWithRelatedDataCreateModel>) => Promise<Talent | null>;
  deleteTalent: (id: number) => Promise<boolean>;
  createDeveloperAccount: (talentId: number, payload: CreateDeveloperAccountModel) => Promise<boolean>;
}

/**
 * Hook để quản lý danh sách talents và các thao tác CRUD
 */
export function useTalents(options: UseTalentsOptions = { autoFetch: true }): UseTalentsReturn {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [myManagedTalents, setMyManagedTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTalents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await talentService.getAll(options.filter);
      
      // Sort by createdAt desc, then by id desc
      const sorted = [...data].sort((a, b) => {
        const createdAtA = (a as { createdAt?: string }).createdAt;
        const createdAtB = (b as { createdAt?: string }).createdAt;
        const timeA = createdAtA ? new Date(createdAtA).getTime() : 0;
        const timeB = createdAtB ? new Date(createdAtB).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return b.id - a.id;
      });
      
      setTalents(sorted);
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      console.error('❌ Không thể tải danh sách talents:', err);
    } finally {
      setLoading(false);
    }
  }, [options.filter]);

  const fetchMyManagedTalents = useCallback(async () => {
    try {
      setError(null);
      const data = await talentService.getMyManagedTalents();
      
      // Sort by createdAt desc, then by id desc
      const sorted = [...data].sort((a, b) => {
        const createdAtA = (a as { createdAt?: string }).createdAt;
        const createdAtB = (b as { createdAt?: string }).createdAt;
        const timeA = createdAtA ? new Date(createdAtA).getTime() : 0;
        const timeB = createdAtB ? new Date(createdAtB).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return b.id - a.id;
      });
      
      setMyManagedTalents(sorted);
    } catch (err) {
      // Không set error vì đây là optional feature
      console.warn('⚠️ Không thể tải danh sách talents quản lý:', err);
      setMyManagedTalents([]);
    }
  }, []);

  const createTalent = useCallback(async (data: TalentWithRelatedDataCreateModel): Promise<Talent | null> => {
    try {
      setError(null);
      const newTalent = await talentService.createWithRelatedData(data);
      // Refresh list after create
      await fetchTalents();
      await fetchMyManagedTalents();
      return newTalent;
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      throw err;
    }
  }, [fetchTalents, fetchMyManagedTalents]);

  const updateTalent = useCallback(async (id: number, data: Partial<TalentWithRelatedDataCreateModel>): Promise<Talent | null> => {
    try {
      setError(null);
      const updated = await talentService.update(id, data as any);
      // Refresh list after update
      await fetchTalents();
      await fetchMyManagedTalents();
      return updated;
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      throw err;
    }
  }, [fetchTalents, fetchMyManagedTalents]);

  const deleteTalent = useCallback(async (id: number): Promise<boolean> => {
    try {
      setError(null);
      await talentService.deleteById(id);
      // Refresh list after delete
      await fetchTalents();
      await fetchMyManagedTalents();
      return true;
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return false;
    }
  }, [fetchTalents, fetchMyManagedTalents]);

  const createDeveloperAccount = useCallback(async (talentId: number, payload: CreateDeveloperAccountModel): Promise<boolean> => {
    try {
      setError(null);
      await talentService.createDeveloperAccount(talentId, payload);
      // Refresh list after create account
      await fetchTalents();
      await fetchMyManagedTalents();
      return true;
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return false;
    }
  }, [fetchTalents, fetchMyManagedTalents]);

  useEffect(() => {
    if (options.autoFetch) {
      fetchTalents();
      fetchMyManagedTalents();
    }
  }, [options.autoFetch, fetchTalents, fetchMyManagedTalents]);

  return {
    talents,
    myManagedTalents,
    loading,
    error,
    refetch: fetchTalents,
    refetchMyManaged: fetchMyManagedTalents,
    createTalent,
    updateTalent,
    deleteTalent,
    createDeveloperAccount,
  };
}

/**
 * Hook để lấy thông tin một talent theo ID
 */
export function useTalent(id: number | string | undefined) {
  const [talent, setTalent] = useState<Talent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTalent = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await talentService.getById(Number(id));
      setTalent(data);
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      console.error('❌ Không thể tải thông tin talent:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTalent();
  }, [fetchTalent]);

  return {
    talent,
    loading,
    error,
    refetch: fetchTalent,
  };
}

