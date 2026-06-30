import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';

function KpiCard({ label, value, variant = 'default' }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value ?? '—'}</p>
      {variant !== 'default' && <Badge variant={variant} className="mt-2">{variant}</Badge>}
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sa/dashboard')
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageTitle title="Super Admin Dashboard" />
      {loading ? (
        <p className="text-gray-500">Loading dashboard...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total Institutes" value={stats?.totalInstitutes} />
          <KpiCard label="Active Institutes" value={stats?.activeInstitutes} variant="success" />
          <KpiCard label="Expiring Soon (7d)" value={stats?.expiringSoon} variant="warning" />
          <KpiCard label="Expired" value={stats?.expiredInstitutes} variant="danger" />
          <KpiCard label="Suspended" value={stats?.suspendedInstitutes} />
          <KpiCard label="Pending Invoices" value={stats?.pendingInvoices} variant="warning" />
          <KpiCard label="Open Tickets" value={stats?.openTickets} variant="info" />
          <KpiCard label="Total Students" value={stats?.totalStudents} />
          <KpiCard label="Total Teachers" value={stats?.totalTeachers} />
        </div>
      )}
    </>
  );
}
