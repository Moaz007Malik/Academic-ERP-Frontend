import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import PaginatedTable from '../../components/common/PaginatedTable';

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
    { key: 'code', label: 'Code', render: (c) => <span className="font-mono">{c.code}</span> },
    { key: 'name', label: 'Course' },
    { key: 'payment', label: 'Payment', render: (c) => <Badge variant={c.paymentType === 'MONTHLY' ? 'info' : 'default'}>{c.paymentType === 'MONTHLY' ? 'Monthly' : 'One-Time'}</Badge> },
    { key: 'duration', label: 'Duration' },
    { key: 'enrolled', label: 'Enrolled', render: (c) => c._count?.enrollments ?? 0 },
    { key: 'status', label: 'Status', render: (c) => <Badge>{c.status}</Badge> },
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/admin' }, { label: 'Individual Courses' }]} />
      <div className="mb-4 flex justify-between">
        <PageTitle title="Individual Courses" subtitle="Short courses independent of regular classes" />
        <Link to="/admin/individual-courses/new"><Button>+ New Course</Button></Link>
      </div>
      <PaginatedTable
        columns={columns}
        rows={courses}
        loading={loading}
        pagination={pagination}
        onPageChange={load}
        onRowClick={(c) => navigate(`/admin/individual-courses/${c.id}`)}
      />
    </>
  );
}
