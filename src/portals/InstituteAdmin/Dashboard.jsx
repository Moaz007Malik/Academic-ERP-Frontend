import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

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
      {loading ? (
        <p className="text-gray-500">Loading dashboard...</p>
      ) : (
        <>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Total Students" value={stats?.totalStudents} />
          <KpiCard label="Total Teachers" value={stats?.totalTeachers} />
          <KpiCard label="Present Today" value={stats?.todayAttendance} />
          <KpiCard label="Fee Collection (Month)" value={stats?.feesCollectedMonth?.toLocaleString()} suffix=" PKR" />
          <KpiCard label="Outstanding Fees" value={stats?.outstandingFees?.toLocaleString()} suffix=" PKR" />
          <KpiCard label="Upcoming Exams (7d)" value={stats?.upcomingExams} />
          <KpiCard label="Open Tickets" value={stats?.openTickets} />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/students"><Button variant="secondary" className="text-sm">Students</Button></Link>
            <Link to="/admin/teachers"><Button variant="secondary" className="text-sm">Teachers</Button></Link>
            <Link to="/admin/individual-courses"><Button variant="secondary" className="text-sm">Individual Courses</Button></Link>
            <Link to="/admin/attendance"><Button variant="secondary" className="text-sm">Attendance</Button></Link>
            <Link to="/admin/fees"><Button variant="secondary" className="text-sm">Fees</Button></Link>
            <Link to="/admin/exams"><Button variant="secondary" className="text-sm">Exams</Button></Link>
            <Link to="/admin/subscription"><Button variant="secondary" className="text-sm">Subscription</Button></Link>
          </div>
        </div>
        </>
      )}
    </>
  );
}
