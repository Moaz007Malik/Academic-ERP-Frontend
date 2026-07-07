import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import DetailPageLayout, { SectionCard, StatGrid, StatCard, EmptyState } from '../../components/layout/DetailPageLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';

export default function DegreeDetail() {
  const { degreeId } = useParams();
  const [degree, setDegree] = useState(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({ maxStudents: 50, totalSemesters: 8, registrationFee: 0 });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get(`/admin/degrees/${degreeId}`)
      .then((res) => setDegree(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [degreeId]);

  const createBatch = async (e) => {
    e.preventDefault();
    await api.post(`/admin/degrees/${degreeId}/batches`, batchForm);
    setBatchOpen(false);
    load();
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!degree) return <p className="text-red-600">Degree not found</p>;

  return (
    <DetailPageLayout
      breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Degree', to: '/admin/degrees' }, { label: degree.name }]}
      title={degree.name}
      subtitle={degree.code}
      status={degree.status}
      actions={<Button onClick={() => setBatchOpen(true)}>+ New Batch</Button>}
    >
      <SectionCard title="Batches">
        {degree.batches?.length ? (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-gray-500">
                <th className="py-2">Batch</th><th>Students</th><th>Semester</th><th>Max</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {degree.batches.map((b) => (
                <tr key={b.id} className="border-b border-gray-100">
                  <td className="py-2 font-medium">{b.name}</td>
                  <td>{b._count?.students ?? 0}</td>
                  <td>{b.currentSemester} / {b.totalSemesters}</td>
                  <td>{b.maxStudents}</td>
                  <td><Badge>{b.status}</Badge></td>
                  <td><Link to={`/admin/degrees/batches/${b.id}`} className="text-primary-600 text-xs">Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No batches" action={<Button onClick={() => setBatchOpen(true)}>Create first batch</Button>} />
        )}
      </SectionCard>

      <Modal open={batchOpen} onClose={() => setBatchOpen(false)} title="Create Degree Batch">
        <form onSubmit={createBatch} className="grid gap-3 sm:grid-cols-2">
          <Input className="sm:col-span-2" label="Batch Name *" value={batchForm.name || ''} onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })} required />
          <Input label="Max Students" type="number" value={batchForm.maxStudents} onChange={(e) => setBatchForm({ ...batchForm, maxStudents: e.target.value })} />
          <Input label="Total Semesters" type="number" value={batchForm.totalSemesters} onChange={(e) => setBatchForm({ ...batchForm, totalSemesters: e.target.value })} />
          <Input className="sm:col-span-2" label="Registration Fee" type="number" value={batchForm.registrationFee} onChange={(e) => setBatchForm({ ...batchForm, registrationFee: e.target.value })} />
          <div className="sm:col-span-2"><Button type="submit">Create Batch</Button></div>
        </form>
      </Modal>
    </DetailPageLayout>
  );
}
