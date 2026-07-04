import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import PaginatedTable from '../../components/common/PaginatedTable';
import { EmptyState } from '../../components/layout/DetailPageLayout';

export default function StudentsList() {
  const navigate = useNavigate();
  const [structure, setStructure] = useState({ sessions: [], batches: [], sections: [] });
  const [filters, setFilters] = useState({ sessionId: '', batchId: '', sectionId: '', search: '' });
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/academic/structure').then((res) => {
      const d = res.data.data || {};
      setStructure({
        sessions: d.sessions || [],
        batches: d.batches || [],
        sections: d.sections || [],
      });
    });
  }, []);

  const batchesForSession = structure.batches.filter(
    (b) => !filters.sessionId || b.sessionId === filters.sessionId,
  );
  const sectionsForBatch = structure.sections.filter(
    (s) => !filters.batchId || s.batchId === filters.batchId,
  );

  const canLoad = filters.batchId && filters.sectionId;

  const loadStudents = (page = 1) => {
    if (!canLoad && !filters.search.trim()) return;
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (filters.sessionId) params.set('sessionId', filters.sessionId);
    if (filters.batchId) params.set('batchId', filters.batchId);
    if (filters.sectionId) params.set('sectionId', filters.sectionId);
    if (filters.search.trim()) params.set('search', filters.search.trim());

    api.get(`/admin/students?${params}`)
      .then((res) => {
        setStudents(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (canLoad || filters.search.trim()) loadStudents(1);
    else setStudents([]);
  }, [filters.batchId, filters.sectionId, filters.sessionId]);

  const columns = [
    { key: 'roll', label: 'Roll #', render: (s) => <span className="font-mono">{s.rollNumber || '—'}</span> },
    { key: 'name', label: 'Name', render: (s) => `${s.firstName} ${s.lastName}` },
    { key: 'class', label: 'Class', render: (s) => s.currentBatch?.name || '—' },
    { key: 'section', label: 'Section', render: (s) => s.currentSection?.name || '—' },
    { key: 'status', label: 'Status', render: (s) => <Badge variant="success">{s.status}</Badge> },
    {
      key: 'action',
      label: '',
      render: (s) => (
        <Button type="button" variant="ghost" className="text-xs" onClick={(e) => { e.stopPropagation(); navigate(`/admin/students/${s.id}`); }}>
          View profile
        </Button>
      ),
    },
  ];

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Dashboard', to: '/admin' },
        { label: 'Students' },
      ]} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PageTitle title="Students" subtitle="Select session, class, and section to browse students" />
        <Link to="/admin/academic"><Button variant="secondary">+ Add via Academic Setup</Button></Link>
      </div>

      <div className="mb-4 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <Select label="Academic Session" value={filters.sessionId} onChange={(e) => setFilters({ sessionId: e.target.value, batchId: '', sectionId: '', search: filters.search })}>
          <option value="">Select session</option>
          {structure.sessions.map((s) => <option key={s.id} value={s.id}>{s.name}{s.isActive ? ' (Active)' : ''}</option>)}
        </Select>
        <Select label="Class / Batch" value={filters.batchId} onChange={(e) => setFilters({ ...filters, batchId: e.target.value, sectionId: '' })} disabled={!filters.sessionId}>
          <option value="">Select class</option>
          {batchesForSession.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
        <Select label="Section" value={filters.sectionId} onChange={(e) => setFilters({ ...filters, sectionId: e.target.value })} disabled={!filters.batchId}>
          <option value="">Select section</option>
          {sectionsForBatch.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Input label="Search (optional)" placeholder="Name or roll #" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
      </div>

      <div className="mb-3 flex gap-2">
        <Button onClick={() => loadStudents(1)} disabled={!canLoad && !filters.search.trim()}>Apply</Button>
      </div>

      {!canLoad && !filters.search.trim() ? (
        <EmptyState title="Select class and section" message="Choose an academic session, class, and section above to view students in that group." />
      ) : (
        <PaginatedTable
          columns={columns}
          rows={students}
          loading={loading}
          pagination={pagination}
          onPageChange={loadStudents}
          onRowClick={(s) => navigate(`/admin/students/${s.id}`)}
          emptyMessage="No students in this section."
        />
      )}
    </>
  );
}
