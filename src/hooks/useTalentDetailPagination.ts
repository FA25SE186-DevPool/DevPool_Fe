import { useState, useCallback } from 'react';

const ITEMS_PER_PAGE = 9;

/**
 * Hook để quản lý pagination cho các sections trong Talent Detail page
 */
export function useTalentDetailPagination() {
  const [pageCVs, setPageCVs] = useState(1);
  const [pageProjects, setPageProjects] = useState(1);
  const [pageExperiences, setPageExperiences] = useState(1);
  const [pageJobRoleLevels, setPageJobRoleLevels] = useState(1);
  const [pageCertificates, setPageCertificates] = useState(1);
  const [pageAvailableTimes, setPageAvailableTimes] = useState(1);
  const [pageSkills, setPageSkills] = useState(1);

  // Reset pagination when data changes
  const resetPagination = useCallback((section: string) => {
    switch (section) {
      case 'cvs':
        setPageCVs(1);
        break;
      case 'projects':
        setPageProjects(1);
        break;
      case 'experiences':
        setPageExperiences(1);
        break;
      case 'jobRoleLevels':
        setPageJobRoleLevels(1);
        break;
      case 'certificates':
        setPageCertificates(1);
        break;
      case 'availableTimes':
        setPageAvailableTimes(1);
        break;
      case 'skills':
        setPageSkills(1);
        break;
    }
  }, []);

  return {
    // Page states
    pageCVs,
    setPageCVs,
    pageProjects,
    setPageProjects,
    pageExperiences,
    setPageExperiences,
    pageJobRoleLevels,
    setPageJobRoleLevels,
    pageCertificates,
    setPageCertificates,
    pageAvailableTimes,
    setPageAvailableTimes,
    pageSkills,
    setPageSkills,

    // Constants
    itemsPerPage: ITEMS_PER_PAGE,

    // Helpers
    resetPagination,
  };
}

