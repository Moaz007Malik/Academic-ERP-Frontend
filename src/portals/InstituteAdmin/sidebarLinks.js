import { MODULE_KEYS } from '../../utils/constants';

export const ADMIN_SIDEBAR_LINKS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/academic', label: 'Academic Setup', module: MODULE_KEYS.STUDENT_MANAGEMENT },
  { to: '/admin/students', label: 'Students', module: MODULE_KEYS.STUDENT_MANAGEMENT },
  { to: '/admin/teachers', label: 'Teachers', module: MODULE_KEYS.TEACHER_MANAGEMENT },
  { to: '/admin/exams', label: 'Exams', module: MODULE_KEYS.RESULTS_EXAMS },
  { to: '/admin/results', label: 'Results', module: MODULE_KEYS.RESULTS_EXAMS },
  { to: '/admin/attendance', label: 'Attendance', module: MODULE_KEYS.ATTENDANCE },
  { to: '/admin/fees', label: 'Fees & Finance', module: MODULE_KEYS.FEES_FINANCE },
  { to: '/admin/subscription', label: 'Subscription' },
  { to: '/admin/tickets', label: 'Support', module: null },
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
