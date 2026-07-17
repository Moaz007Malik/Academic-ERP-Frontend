import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { SectionCard, EmptyState } from '../../components/layout/DetailPageLayout';
import { RowActions, confirmDelete } from '../../components/common/RowActions';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const EXAM_TYPES = ['MONTHLY', 'MID_TERM', 'FINAL', 'BOARD', 'SUPPLY'];

function toDateInput(d) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

function formatRange(start, end) {
  if (!start && !end) return 'Schedule not set';
  const s = start ? new Date(start).toLocaleDateString() : '—';
  const e = end ? new Date(end).toLocaleDateString() : '—';
  return `${s} → ${e}`;
}

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [structure, setStructure] = useState({ sections: [] });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ examType: 'FINAL', theoryMax: 75, practicalMax: 15, internalMax: 10, passPercentage: 33 });
  const [error, setError] = useState('');
  const { submitting, run } = useAsyncSubmit();

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/admin/exams'), api.get('/admin/academic/structure')])
      .then(([eRes, aRes]) => {
        setExams(eRes.data.data || []);
        setStructure(aRes.data.data || {});
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditId(null);
    setForm({ examType: 'FINAL', theoryMax: 75, practicalMax: 15, internalMax: 10, passPercentage: 33 });
    setError('');
    setOpen(true);
  };

  const openEdit = (ex) => {
    setEditId(ex.id);
    setForm({
      name: ex.name,
      examType: ex.examType,
      sectionId: ex.sectionId || '',
      theoryMax: Number(ex.theoryMax),
      practicalMax: Number(ex.practicalMax),
      internalMax: Number(ex.internalMax),
      passPercentage: Number(ex.passPercentage),
      startDate: toDateInput(ex.startDate),
      endDate: toDateInput(ex.endDate),
    });
    setError('');
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { skipped } = await run(async () => {
      try {
        if (editId) await api.put(`/admin/exams/${editId}`, form);
        else await api.post('/admin/exams', form);
        setOpen(false);
        load();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to save exam');
        throw err;
      }
    });
    if (skipped) setError('Please wait, saving...');
  };

  const publish = async (id) => {
    if (!window.confirm('Publish results for this exam? Students will see marks in their portal.')) return;
    await api.post(`/admin/exams/${id}/publish`);
    load();
  };

  const handleDelete = async (ex) => {
    if (!confirmDelete(`Delete exam "${ex.name}"?`)) return;
    try {
      await api.delete(`/admin/exams/${ex.id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <PageTitle title="Exams" subtitle="Schedule exams and publish results for student portals" />
        <Button onClick={openAdd}>+ Create Exam</Button>
      </div>
      {error && !open && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading exams...</p>
      ) : exams.length === 0 ? (
        <EmptyState title="No exams yet" message="Create your first exam to start entering results." action={<Button onClick={openAdd}>Create Exam</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {exams.map((ex) => (
            <SectionCard
              key={ex.id}
              title={ex.name}
              action={<Badge variant={ex.isPublished ? 'success' : 'warning'}>{ex.isPublished ? 'Published' : 'Draft'}</Badge>}
            >
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="info">{String(ex.examType).replace('_', ' ')}</Badge>
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                    Theory {ex.theoryMax} · Practical {ex.practicalMax} · Internal {ex.internalMax}
                  </span>
                </div>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">Class: </span>
                  {ex.section ? `${ex.section.batch?.name} — ${ex.section.name}` : '—'}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">Schedule: </span>
                  {formatRange(ex.startDate, ex.endDate)}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">Results entered: </span>
                  {ex._count?.results || 0} · Pass mark {ex.passPercentage}%
                </p>
                <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                  <Link to={`/admin/exams/${ex.id}`}><Button variant="ghost" className="px-2 py-1 text-xs">View</Button></Link>
                  {!ex.isPublished && (
                    <>
                      <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => publish(ex.id)}>Publish</Button>
                      <RowActions onEdit={() => openEdit(ex)} onDelete={() => handleDelete(ex)} />
                    </>
                  )}
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Edit Exam' : 'Create Exam'} wide>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
          <Input label="Exam Name *" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="col-span-2" />
          <Select label="Exam Type" value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}>
            {EXAM_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </Select>
          <Select label="Section" value={form.sectionId || ''} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}>
            <option value="">Select section</option>
            {structure.sections?.map((s) => (
              <option key={s.id} value={s.id}>{s.batch?.name} — Section {s.name}</option>
            ))}
          </Select>
          <Input label="Theory Max" type="number" value={form.theoryMax} onChange={(e) => setForm({ ...form, theoryMax: Number(e.target.value) })} />
          <Input label="Practical Max" type="number" value={form.practicalMax} onChange={(e) => setForm({ ...form, practicalMax: Number(e.target.value) })} />
          <Input label="Internal Max" type="number" value={form.internalMax} onChange={(e) => setForm({ ...form, internalMax: Number(e.target.value) })} />
          <Input label="Pass %" type="number" value={form.passPercentage} onChange={(e) => setForm({ ...form, passPercentage: Number(e.target.value) })} />
          <Input label="Start Date" type="date" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <Input label="End Date" type="date" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          <div className="col-span-2">
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : editId ? 'Update Exam' : 'Create Exam'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
