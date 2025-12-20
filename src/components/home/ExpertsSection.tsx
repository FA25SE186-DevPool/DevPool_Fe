import type React from "react"
import { useState, useEffect } from "react"
import { CheckCircle } from "lucide-react"
import ProfessionalCard from "../client/professional-page/ProfessionalCard"
import type { Professional } from "../client/professional-page/types"
import { talentService, type TalentDetailedModel } from "../../services/Talent"
import { skillService } from "../../services/Skill"
import { locationService } from "../../services/location"
import { jobRoleLevelService } from "../../services/JobRoleLevel"
import { jobRoleService } from "../../services/JobRole"

const ExpertsSection: React.FC = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load favorites từ localStorage
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('professional_favorites');
      if (savedFavorites) {
        const favoritesArray = JSON.parse(savedFavorites);
        setFavorites(new Set(favoritesArray));
      }
    } catch (error) {
      console.error("❌ Lỗi khi tải favorites từ localStorage:", error);
    }
  }, []);

  // Fetch top 3 professionals
  useEffect(() => {
    const fetchTopProfessionals = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch talents with detailed data
        const [talentsData, talentsBasicData] = await Promise.all([
          talentService.getAllDetailed({ excludeDeleted: true }),
          talentService.getAll({ excludeDeleted: true, pageSize: 1000 }) // Get more data to ensure we have codes
        ]);

        // Create code mapping from basic talent data
        const talentCodeMap = new Map<number, string>();
        let talentsBasicArray: any[] = [];

        if (Array.isArray(talentsBasicData)) {
          talentsBasicArray = talentsBasicData;
        } else if (talentsBasicData && typeof talentsBasicData === 'object') {
          const obj = talentsBasicData as any;
          if (obj.data && Array.isArray(obj.data)) {
            talentsBasicArray = obj.data;
          } else if (obj.items && Array.isArray(obj.items)) {
            talentsBasicArray = obj.items;
          }
        }

        talentsBasicArray.forEach((talent: any) => {
          if (talent.id && talent.code) {
            talentCodeMap.set(talent.id, talent.code);
          }
        });

        // Fetch lookup data
        const [skillsData, locationsData, jobRoleLevelsData, jobRolesData] = await Promise.all([
          skillService.getAll({ excludeDeleted: true }),
          locationService.getAll({ excludeDeleted: true }),
          jobRoleLevelService.getAll({ excludeDeleted: true }),
          jobRoleService.getAll({ excludeDeleted: true })
        ]);

        // Create lookup maps
        const skillsMap = new Map();
        (skillsData || []).forEach((skill: any) => {
          skillsMap.set(skill.id, skill);
        });

        const locationsMap = new Map();
        const uniqueLocations = new Set<string>();
        (locationsData || []).forEach((location: any) => {
          locationsMap.set(location.id, location);
          if (location.name) {
            uniqueLocations.add(location.name);
          }
        });

        const jobRoleLevelsMap = new Map();
        (jobRoleLevelsData || []).forEach((jrl: any) => {
          jobRoleLevelsMap.set(jrl.id, jrl);
        });

        const jobRolesMap = new Map();
        (jobRolesData || []).forEach((jr: any) => {
          jobRolesMap.set(jr.id, jr);
        });

        // Ensure talentsData is an array
        let talentsArray: TalentDetailedModel[] = [];
        if (Array.isArray(talentsData)) {
          talentsArray = talentsData;
        } else if (talentsData && typeof talentsData === 'object') {
          const obj = talentsData as any;
          if (obj.data && Array.isArray(obj.data)) {
            talentsArray = obj.data;
          } else if (obj.items && Array.isArray(obj.items)) {
            talentsArray = obj.items;
          }
        }

        // Map TalentDetailedModel to Professional
        const mappedProfessionals: Professional[] = talentsArray.map((talent: TalentDetailedModel) => {
          // Get location name - return undefined if no location
          const locationName = talent.locationName ||
            (talent.locationId ? locationsMap.get(talent.locationId)?.name : null) ||
            undefined;

          // Get position from jobRoleLevels (first active one)
          const activeJobRoleLevel = talent.jobRoleLevels?.[0];
          let position = "—";
          if (activeJobRoleLevel) {
            const jrl = jobRoleLevelsMap.get(activeJobRoleLevel.jobRoleLevelId);
            const jr = jrl ? jobRolesMap.get(jrl.jobRoleId) : null;

            // Convert level enum to display name
            let levelDisplay = "—";
            if (jrl?.level !== undefined) {
              const levelMap: Record<number, string> = {
                0: "Junior",
                1: "Middle",
                2: "Senior",
                3: "Lead"
              };
              levelDisplay = levelMap[jrl.level] || `Level ${jrl.level}`;
            }

            position = jr ? `${jr.name} - ${levelDisplay}` : (jrl?.name || "—");
          }

          // Map skills
          const mappedSkills = (talent.skills || []).map((skill: any) => {
            const skillInfo = skillsMap.get(skill.skillId);
            // Map level from number/string to Vietnamese
            let level: 'Cơ bản' | 'Khá' | 'Giỏi' | 'Chuyên gia' = 'Cơ bản';
            if (skill.level) {
              const levelStr = String(skill.level).toLowerCase();
              if (levelStr.includes('expert')) {
                level = 'Chuyên gia';
              } else if (levelStr.includes('advanced') || levelStr.includes('giỏi')) {
                level = 'Giỏi';
              } else if (levelStr.includes('intermediate') || levelStr.includes('khá')) {
                level = 'Khá';
              } else {
                level = 'Cơ bản';
              }
            }
            return {
              name: skillInfo?.name || `Skill #${skill.skillId}`,
              level,
              yearsExp: skill.yearsExp || 0
            };
          });

          // Calculate total projects from workExperiences
          const totalProjects = talent.projects?.length || 0;
          const totalWorkExperiences = talent.workExperiences?.length || 0;

          // Determine availability based on status
          let availability: 'available' | 'busy' | 'unavailable' = 'available';
          if (talent.status) {
            const statusLower = talent.status.toLowerCase();
            if (statusLower.includes('working') || statusLower.includes('available')) {
              availability = 'available';
            } else if (statusLower.includes('busy')) {
              availability = 'busy';
            } else {
              availability = 'unavailable';
            }
          }

          // Get avatar (profilePictureUrl or default)
          const avatar = talent.profilePictureUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(talent.fullName)}&background=6366f1&color=fff&size=150`;

          // Try to get code from different sources
          let talentCode = talentCodeMap.get(talent.id);

          // If no code from basic API, try to generate from userId or create a meaningful code
          if (!talentCode) {
            if (talent.userId) {
              // Use userId as base for code
              talentCode = `USR${talent.userId.slice(-3).toUpperCase()}`;
            } else {
              // Fallback to ID-based code
              talentCode = `EMP${String(talent.id).padStart(3, '0')}`;
            }
          }

          return {
            id: String(talent.id),
            name: talent.fullName,
            title: position,
            avatar,
            location: locationName,
            workingMode: talent.workingMode || undefined,
            status: talent.status || undefined,
            bio: talent.bio || undefined,
            phoneNumber: talent.phoneNumber || undefined,
            hourlyRate: 0, // Not available in talent data
            rating: 4.5, // Default rating
            reviewCount: 0, // Not available
            skills: mappedSkills,
            availability,
            completedProjects: totalProjects,
            description: talent.bio || "",
            isOnline: false, // Not available
            experience: activeJobRoleLevel?.yearsOfExp || 0,
            category: "IT", // Default category
            languages: [],
            certifications: [],
            responseTime: "< 24 giờ",
            successRate: 95,
            workExperiences: totalWorkExperiences, // Tổng số dự án từ work experiences
            code: talentCode // Add real talent code
          };
        });

        // Filter out unavailable talents and sort by projects + skills
        const availableProfessionals = mappedProfessionals.filter(p => p.availability !== 'unavailable');

        // Sort by combined score: projects * 2 + skills (to give more weight to projects)
        const sortedProfessionals = availableProfessionals.sort((a, b) => {
          const scoreA = (a.completedProjects || 0) * 2 + a.skills.length;
          const scoreB = (b.completedProjects || 0) * 2 + b.skills.length;
          return scoreB - scoreA; // Descending order
        });

        // Take top 3
        const topProfessionals = sortedProfessionals.slice(0, 3);

        setProfessionals(topProfessionals);
      } catch (err: any) {
        console.error("❌ Lỗi tải top professionals:", err);
        setError(err.message || "Không thể tải dữ liệu chuyên gia");
      } finally {
        setLoading(false);
      }
    };

    fetchTopProfessionals();
  }, []);

  // Toggle favorite
  const toggleFavorite = (professionalId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(professionalId)) {
      newFavorites.delete(professionalId);
    } else {
      newFavorites.add(professionalId);
    }
    setFavorites(newFavorites);

    // Save to localStorage
    try {
      localStorage.setItem('professional_favorites', JSON.stringify(Array.from(newFavorites)));
    } catch (error) {
      console.error("❌ Lỗi khi lưu favorites:", error);
    }
  };

  // Toggle select for contact
  const toggleSelectForContact = (_professionalId: string) => {
    // This is just for compatibility, not used in homepage
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Nhân sự DevPool Nổi Bật</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Kết nối với những tài năng hàng đầu trong ngành IT</p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Nhân sự DevPool Nổi Bật</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Kết nối với những tài năng hàng đầu trong ngành IT</p>
          </div>
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Nhân sự DevPool Nổi Bật</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Kết nối với những tài năng hàng đầu trong ngành IT</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {professionals.map((professional) => (
            <ProfessionalCard
              key={professional.id}
              professional={professional}
              isFavorite={favorites.has(professional.id)}
              onToggleFavorite={toggleFavorite}
              onToggleSelectForContact={toggleSelectForContact}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default ExpertsSection
