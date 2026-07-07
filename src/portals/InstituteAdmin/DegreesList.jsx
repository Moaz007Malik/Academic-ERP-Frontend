import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import PaginatedTable from '../../components/common/PaginatedTable';

export default function DegreesList() {
  const navigate = useNavigate();
  const [degrees, setDegrees] = useState([]);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ status: 'ACTIVE' });

  const load = (page = 1) => {
    setLoading(true);
    api.get('/admin/degrees', { params: { page, limit: 20, search: search || undefined } })
      .then((res) => {
        setDegrees(res.data.data || []);
        setPagination(res.data.pagination || {});
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const create = async (e) => {
    e.preventDefault();
    const res = await api.post('/admin/degrees', form);
    setOpen(false);
    setForm({ status: 'ACTIVE' });
    navigate(`/admin/degrees/${res.data.data.id}`);
  };

  const columns = [
    { key: 'name', label: 'Program', render: (d) => <span className="font-medium text-primary-600">{d.name}</span> },
    { key: 'code', label: 'Code' },
    { key: 'batches', label: 'Batches', render: (d) => d._count?.batches ?? 0 },
    { key: 'status', label: 'Status', render: (d) => <Badge>{d.status}</Badge> },
  ];

  return (
    <>
      <PageTitle title="Degree Programs" subtitle="Manage university degree programs and batches" />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or code" />
        <Button onClick={() => setOpen(true)}>+ New Degree</Button>
      </div>

      <PaginatedTable
        columns={columns}
        rows={degrees}
        loading={loading}
        pagination={pagination}
        onPageChange={load}
        onRowClick={(d) => navigate(`/admin/degrees/${d.id}`)}
        emptyTitle="No degree programs yet"
      />

      <Modal open={open} onClose={() => setOpen(false)} title="Create Degree Program">
        <form onSubmit={create} className="space-y-3">
          <Input label="Degree Name *" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Code *" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <Input label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button type="submit">Create</Button>
        </form>
      </Modal>
    </>
  );
}
