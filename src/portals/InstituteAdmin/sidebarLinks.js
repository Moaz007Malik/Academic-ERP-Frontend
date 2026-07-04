import { MODULE_KEYS } from '../../utils/constants';

/** Institute admin navigation — each item may require a module */
export const ADMIN_SIDEBAR_LINKS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/academic', label: 'Academic Setup', module: MODULE_KEYS.STUDENT_MANAGEMENT },
  { to: '/admin/students', label: 'Students', module: MODULE_KEYS.STUDENT_MANAGEMENT },
  { to: '/admin/teachers', label: 'Teachers', module: MODULE_KEYS.TEACHER_MANAGEMENT },
  { to: '/admin/exams', label: 'Exams', module: MODULE_KEYS.RESULTS_EXAMS },
  { to: '/admin/results', label: 'Results', module: MODULE_KEYS.RESULTS_EXAMS },
  { to: '/admin/attendance', label: 'Attendance', module: MODULE_KEYS.ATTENDANCE },
  { to: '/admin/fees', label: 'Fees & Finance', module: MODULE_KEYS.FEES_FINANCE },
  { to: '/admin/timetable', label: 'Timetable', module: MODULE_KEYS.TIMETABLE },
  { to: '/admin/idcard', label: 'Student ID Card', module: MODULE_KEYS.ID_CARD_DESIGNER },
  { to: '/admin/reports', label: 'Reports', module: MODULE_KEYS.REPORTS },
  { to: '/admin/settings', label: 'Profile Settings', module: MODULE_KEYS.PROFILE_SETTINGS },
  { to: '/admin/subscription', label: 'Subscription' },
  { to: '/admin/tickets', label: 'Support', module: MODULE_KEYS.TICKETS },
];

export function getAdminSidebarLinks(user) {
  if (!user) return [];

  const subscriptionExpired =
    user.subscriptionExpired || user.instituteStatus === 'EXPIRED';

  if (subscriptionExpired) {
    return [
      { to: '/admin/subscription', label: 'Subscription' },
      { to: '/admin/tickets', label: 'Support' },
    ];
  }

  const modules = user.modules || [];
  return ADMIN_SIDEBAR_LINKS.filter((link) => {
    if (!link.module) return true;
    return modules.includes(link.module);
  });
}
