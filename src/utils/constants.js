export const MODULE_KEYS = {
  STUDENT_MANAGEMENT: 'STUDENT_MANAGEMENT',
  TEACHER_MANAGEMENT: 'TEACHER_MANAGEMENT',
  ATTENDANCE: 'ATTENDANCE',
  FEES_FINANCE: 'FEES_FINANCE',
  RESULTS_EXAMS: 'RESULTS_EXAMS',
  TIMETABLE: 'TIMETABLE',
  LIBRARY: 'LIBRARY',
  HOSTEL: 'HOSTEL',
  TRANSPORT: 'TRANSPORT',
  HR_PAYROLL: 'HR_PAYROLL',
  PARENT_PORTAL: 'PARENT_PORTAL',
  STUDENT_PORTAL: 'STUDENT_PORTAL',
  TEACHER_PORTAL: 'TEACHER_PORTAL',
  LMS: 'LMS',
  ASSIGNMENTS_QUIZ: 'ASSIGNMENTS_QUIZ',
  ADMISSION: 'ADMISSION',
  INVENTORY: 'INVENTORY',
  CERTIFICATES: 'CERTIFICATES',
  ONLINE_CLASSES: 'ONLINE_CLASSES',
  ALUMNI: 'ALUMNI',
  PLACEMENT: 'PLACEMENT',
  RESEARCH: 'RESEARCH',
  SMS_NOTIFICATIONS: 'SMS_NOTIFICATIONS',
  EMAIL_NOTIFICATIONS: 'EMAIL_NOTIFICATIONS',
  ID_CARD_DESIGNER: 'ID_CARD_DESIGNER',
  DOCUMENT_MANAGEMENT: 'DOCUMENT_MANAGEMENT',
  REPORTS: 'REPORTS',
  TICKETS: 'TICKETS',
  PROFILE_SETTINGS: 'PROFILE_SETTINGS',
  INDIVIDUAL_COURSES: 'INDIVIDUAL_COURSES',
  DEGREE: 'DEGREE',
};

export const MODULE_CATALOG = [
  { key: MODULE_KEYS.STUDENT_MANAGEMENT, label: 'Student Management', category: 'Core' },
  { key: MODULE_KEYS.TEACHER_MANAGEMENT, label: 'Teacher Management', category: 'Core' },
  { key: MODULE_KEYS.ATTENDANCE, label: 'Attendance', category: 'Core' },
  { key: MODULE_KEYS.FEES_FINANCE, label: 'Fee Management', category: 'Core' },
  { key: MODULE_KEYS.RESULTS_EXAMS, label: 'Examination & Results', category: 'Core' },
  { key: MODULE_KEYS.TIMETABLE, label: 'Timetable', category: 'Academic' },
  { key: MODULE_KEYS.STUDENT_PORTAL, label: 'Student Portal', category: 'Portals' },
  { key: MODULE_KEYS.PARENT_PORTAL, label: 'Parent Portal', category: 'Portals' },
  { key: MODULE_KEYS.TEACHER_PORTAL, label: 'Teacher Portal', category: 'Portals' },
  { key: MODULE_KEYS.LIBRARY, label: 'Library', category: 'Operations' },
  { key: MODULE_KEYS.HOSTEL, label: 'Hostel', category: 'Operations' },
  { key: MODULE_KEYS.TRANSPORT, label: 'Transport', category: 'Operations' },
  { key: MODULE_KEYS.HR_PAYROLL, label: 'HR & Payroll', category: 'Operations' },
  { key: MODULE_KEYS.ADMISSION, label: 'Admission', category: 'Academic' },
  { key: MODULE_KEYS.ASSIGNMENTS_QUIZ, label: 'Assignments & Quiz', category: 'Academic' },
  { key: MODULE_KEYS.LMS, label: 'LMS', category: 'Academic' },
  { key: MODULE_KEYS.CERTIFICATES, label: 'Certificates', category: 'Documents' },
  { key: MODULE_KEYS.ID_CARD_DESIGNER, label: 'Student ID Card', category: 'Documents' },
  { key: MODULE_KEYS.DOCUMENT_MANAGEMENT, label: 'Document Management', category: 'Documents' },
  { key: MODULE_KEYS.SMS_NOTIFICATIONS, label: 'SMS Notifications', category: 'Communications' },
  { key: MODULE_KEYS.EMAIL_NOTIFICATIONS, label: 'Email Notifications', category: 'Communications' },
  { key: MODULE_KEYS.REPORTS, label: 'Reports', category: 'Analytics' },
  { key: MODULE_KEYS.TICKETS, label: 'Support Tickets', category: 'Support' },
  { key: MODULE_KEYS.INVENTORY, label: 'Inventory', category: 'Operations' },
  { key: MODULE_KEYS.ONLINE_CLASSES, label: 'Online Classes', category: 'Academic' },
  { key: MODULE_KEYS.ALUMNI, label: 'Alumni', category: 'Community' },
  { key: MODULE_KEYS.PLACEMENT, label: 'Placement', category: 'Community' },
  { key: MODULE_KEYS.RESEARCH, label: 'Research', category: 'Academic' },
  { key: MODULE_KEYS.PROFILE_SETTINGS, label: 'Profile Settings', category: 'System' },
  { key: MODULE_KEYS.INDIVIDUAL_COURSES, label: 'Individual Courses', category: 'Academic' },
  { key: MODULE_KEYS.DEGREE, label: 'Degree Programs', category: 'Academic' },
];

export const MODULE_LABELS = Object.fromEntries(
  MODULE_CATALOG.map((m) => [m.key, m.label])
);

export function summarizeModules(activeModules = []) {
  const active = new Set(activeModules);
  const enabled = MODULE_CATALOG.filter((m) => active.has(m.key));
  const disabled = MODULE_CATALOG.filter((m) => !active.has(m.key));
  return {
    active: enabled,
    disabled,
    activeCount: enabled.length,
    disabledCount: disabled.length,
    totalCount: MODULE_CATALOG.length,
    remainingCount: MODULE_CATALOG.length - enabled.length,
  };
}

export function hasModule(user, moduleKey) {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  return (user.modules || []).includes(moduleKey);
}

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
