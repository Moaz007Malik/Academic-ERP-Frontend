import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import PaginatedTable from '../../components/common/PaginatedTable';

const STATUS_BADGE = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  COMPLETED: 'info',
  CANCELLED: 'danger',
};

export default function IndividualCoursesList() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  const load = (page = 1) => {
    setLoading(true);
    api.get(`/admin/individual-courses?page=${page}&limit=20`)
      .then((res) => {
        setCourses(res.data.data || []);
        setPagination(res.data.pagination || {});
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const columns = [
    {
      key: 'name',
      label: 'Course',
      render: (c) => (
        <div>
          <p className="font-medium text-gray-900">{c.name}</p>
          <p className="font-mono text-xs text-gray-400">{c.code}</p>
        </div>
      ),
    },
    { key: 'payment', label: 'Payment', render: (c) => <Badge variant={c.paymentType === 'MONTHLY' ? 'info' : 'default'}>{c.paymentType === 'MONTHLY' ? 'Monthly' : 'One-Time'}</Badge> },
    { key: 'duration', label: 'Duration', render: (c) => <span className="text-gray-700">{c.duration || '—'}</span> },
    {
      key: 'enrolled',
      label: 'Enrolled',
      render: (c) => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
          {c._count?.enrollments ?? 0}{c.capacity ? ` / ${c.capacity}` : ''}
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (c) => <Badge variant={STATUS_BADGE[c.status] || 'default'}>{c.status}</Badge> },
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/admin' }, { label: 'Individual Courses' }]} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageTitle title="Individual Courses" subtitle="Short courses independent of regular classes" />
        <Link to="/admin/individual-courses/new"><Button className="shadow-sm">+ New Course</Button></Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <PaginatedTable
          columns={columns}
          rows={courses}
          loading={loading}
          pagination={pagination}
          onPageChange={load}
          onRowClick={(c) => navigate(`/admin/individual-courses/${c.id}`)}
          emptyMessage="No individual courses yet. Create one to get started."
        />
      </div>
    </>
  );
}