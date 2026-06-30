import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { RowActions, confirmDelete } from '../../components/common/RowActions';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const EXAM_TYPES = ['MONTHLY', 'MID_TERM', 'FINAL', 'BOARD', 'SUPPLY'];

function toDateInput(d) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
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
        if (editId) {
          await api.put(`/admin/exams/${editId}`, form);
        } else {
          await api.post('/admin/exams', form);
        }
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
      <div className="mb-4 flex items-center justify-between">
        <PageTitle title="Exams" subtitle="Pakistani marking: Theory 75 + Practical 15 + Internal 10" />
        <Button onClick={openAdd}>+ Create Exam</Button>
      </div>
      {error && !open && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Exam</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Class</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Marks</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Results</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : exams.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No exams yet</td></tr>
            ) : exams.map((ex) => (
              <tr key={ex.id}>
                <td className="px-4 py-3 font-medium">{ex.name}</td>
                <td className="px-4 py-3">{ex.examType}</td>
                <td className="px-4 py-3">{ex.section ? `${ex.section.batch?.name} — ${ex.section.name}` : '—'}</td>
                <td className="px-4 py-3">{ex.theoryMax}+{ex.practicalMax}+{ex.internalMax}</td>
                <td className="px-4 py-3">{ex._count?.results || 0}</td>
                <td className="px-4 py-3">
                  <Badge variant={ex.isPublished ? 'success' : 'warning'}>{ex.isPublished ? 'Published' : 'Draft'}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {!ex.isPublished && (
                      <>
                        <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => publish(ex.id)}>Publish</Button>
                        <RowActions onEdit={() => openEdit(ex)} onDelete={() => handleDelete(ex)} />
                      </>
                    )}
                    {ex.isPublished && <span className="text-xs text-gray-400">Locked</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
