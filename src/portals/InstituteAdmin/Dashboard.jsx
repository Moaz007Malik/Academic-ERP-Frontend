import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';

function KpiCard({ label, value, suffix = '' }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">
        {value ?? '—'}{suffix}
      </p>
    </div>
  );
}

export default function InstituteAdminDashboard() {
  const { user } = useSelector((s) => s.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageTitle title={`Welcome, ${user?.firstName || 'Admin'}`} />
      {user?.mustChangePass && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Please change your temporary password from profile settings.
        </div>
      )}
      {stats?.subscription && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <span>Plan: <strong>{stats.subscription.plan || '—'}</strong></span>
          <Badge variant={stats.subscription.status === 'ACTIVE' ? 'success' : 'warning'}>
            {stats.subscription.status}
          </Badge>
          {stats.subscription.daysRemaining != null && (
            <span>{stats.subscription.daysRemaining} days remaining</span>
          )}
        </div>
      )}
      {stats?.modules && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Module Access Overview</h2>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-xl font-bold text-green-700">{stats.modules.activeCount}</p>
              <p className="text-xs text-green-800">Active Modules</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-center">
              <p className="text-xl font-bold text-amber-700">{stats.modules.disabledCount}</p>
              <p className="text-xs text-amber-800">Disabled Modules</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-xl font-bold text-gray-700">{stats.modules.remainingCount}</p>
              <p className="text-xs text-gray-600">Remaining Available</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.modules.active?.slice(0, 12).map((m) => (
              <span key={m.key} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">{m.label}</span>
            ))}
            {stats.modules.activeCount > 12 && (
              <span className="text-xs text-gray-500">+{stats.modules.activeCount - 12} more</span>
            )}
          </div>
        </div>
      )}
      {loading ? (
        <p className="text-gray-500">Loading dashboard...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Total Students" value={stats?.totalStudents} />
          <KpiCard label="Total Teachers" value={stats?.totalTeachers} />
          <KpiCard label="Present Today" value={stats?.todayAttendance} />
          <KpiCard label="Fee Collection (Month)" value={stats?.feesCollectedMonth?.toLocaleString()} suffix=" PKR" />
          <KpiCard label="Outstanding Fees" value={stats?.outstandingFees?.toLocaleString()} suffix=" PKR" />
          <KpiCard label="Upcoming Exams (7d)" value={stats?.upcomingExams} />
          <KpiCard label="Open Tickets" value={stats?.openTickets} />
        </div>
      )}
    </>
  );
}
