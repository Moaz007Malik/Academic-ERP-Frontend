export const MODULE_KEYS = {
  STUDENT_MANAGEMENT: 'STUDENT_MANAGEMENT',
  TEACHER_MANAGEMENT: 'TEACHER_MANAGEMENT',
  ATTENDANCE: 'ATTENDANCE',
  FEES_FINANCE: 'FEES_FINANCE',
  RESULTS_EXAMS: 'RESULTS_EXAMS',
  TIMETABLE: 'TIMETABLE',
  LIBRARY: 'LIBRARY',
  HR_PAYROLL: 'HR_PAYROLL',
};

export const PORTAL_TYPES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  INSTITUTE_ADMIN: 'INSTITUTE_ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
};

export const PORTAL_ROUTES = {
  SUPER_ADMIN: '/sa',
  INSTITUTE_ADMIN: '/admin',
  ACCOUNTANT: '/admin',
  HR: '/admin',
  LIBRARIAN: '/admin',
  RECEPTIONIST: '/admin',
  STAFF: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
  PARENT: '/parent',
};

export function getPortalRouteForRole(role) {
  return PORTAL_ROUTES[role] || '/login';
}

export const MODULE_LABELS = {
  STUDENT_MANAGEMENT: 'Students',
  TEACHER_MANAGEMENT: 'Teachers',
  ATTENDANCE: 'Attendance',
  FEES_FINANCE: 'Fees & Finance',
  RESULTS_EXAMS: 'Results & Exams',
  TIMETABLE: 'Timetable',
  LIBRARY: 'Library',
  HR_PAYROLL: 'HR & Payroll',
};
