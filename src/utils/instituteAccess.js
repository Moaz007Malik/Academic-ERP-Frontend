/** Institute access states controlled by Super Admin */
export const INSTITUTE_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  SUSPENDED: 'SUSPENDED',
  BLOCKED: 'BLOCKED',
};

export function isInstituteAccessBlocked(user) {
  if (!user || user.role === 'SUPER_ADMIN') return false;
  return ['BLOCKED', 'SUSPENDED'].includes(user.instituteStatus);
}

export function isSubscriptionExpiredForUser(user) {
  if (!user || user.role === 'SUPER_ADMIN') return false;
  if (user.subscriptionExpired) return true;
  if (user.instituteStatus === 'EXPIRED') return true;
  return false;
}

export function getAccessDeniedRedirect(user) {
  if (!user) return '/login';
  if (user.instituteStatus === 'BLOCKED') return '/access-denied?reason=blocked';
  if (user.instituteStatus === 'SUSPENDED') return '/access-denied?reason=suspended';
  if (isSubscriptionExpiredForUser(user) && user.role === 'INSTITUTE_ADMIN') {
    return '/admin/subscription/expired';
  }
  if (isSubscriptionExpiredForUser(user)) {
    return '/access-denied?reason=expired';
  }
  return null;
}
