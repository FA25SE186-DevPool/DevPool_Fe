/**
 * Working Mode Constants
 * Định nghĩa các chế độ làm việc (có thể kết hợp bằng bit flags)
 */
export const WORKING_MODE = {
  None: 0,
  Onsite: 1,
  Remote: 2,
  Hybrid: 4,
  Flexible: 8,
} as const;

export type WorkingMode = typeof WORKING_MODE[keyof typeof WORKING_MODE];

// Export với tên cũ để tương thích ngược (sẽ xóa sau khi refactor xong)
export const WorkingMode = WORKING_MODE;

