import Badge from '../common/Badge';
import Breadcrumbs from './Breadcrumbs';

export default function DetailPageLayout({
  breadcrumbs = [],
  title,
  subtitle,
  status,
  statusVariant = 'default',
  actions,
  tabs = [],
  activeTab,
  onTabChange,
  children,
}) {
  return (
    <div>
      <Breadcrumbs items={breadcrumbs} />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {status && <Badge variant={statusVariant}>{status}</Badge>}
          </div>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {tabs.length > 0 && (
        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange?.(tab.id)}
              className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatGrid({ children, cols = 4 }) {
  const grid = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' };
  return <div className={`grid grid-cols-1 gap-4 ${grid[cols] || grid[4]}`}>{children}</div>;
}

export function StatCard({ label, value, suffix = '', variant = 'default' }) {
  const styles = {
    default: 'border-gray-200 bg-white',
    success: 'border-green-200 bg-green-50',
    warning: 'border-amber-200 bg-amber-50',
    danger: 'border-red-200 bg-red-50',
    info: 'border-blue-200 bg-blue-50',
  };
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${styles[variant] || styles.default}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value ?? '—'}{suffix}</p>
    </div>
  );
}

export function InfoGrid({ items = [] }) {
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.filter((i) => i.value != null && i.value !== '').map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-medium uppercase text-gray-500">{item.label}</dt>
          <dd className="mt-0.5 text-sm font-medium text-gray-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SectionCard({ title, children, action }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ title = 'No data', message, action }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
      <p className="text-base font-medium text-gray-700">{title}</p>
      {message && <p className="mt-1 text-sm text-gray-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
