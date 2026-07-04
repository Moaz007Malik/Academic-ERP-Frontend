import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import { RowActions, confirmDelete } from '../../components/common/RowActions';
import DocumentManager from '../../components/documents/DocumentManager';
import CredentialsRevealModal from '../../components/common/CredentialsRevealModal';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const STATUS_OPTIONS = ['ACTIVE', 'ALUMNI', 'EXPELLED', 'TRANSFERRED'];

export default function StudentsList() {
  const [students, setStudents] = useState([]);
  const [structure, setStructure] = useState({ batches: [], sections: [] });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [docsFor, setDocsFor] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ createPortalAccount: true });
  const [error, setError] = useState('');
  const [revealedCreds, setRevealedCreds] = useState(null);
  const { submitting, run } = useAsyncSubmit();

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/students?limit=100'),
      api.get('/admin/academic/structure'),
    ])
      .then(([sRes, aRes]) => {
        setStudents(sRes.data.data || []);
        setStructure(aRes.data.data || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const sectionsForBatch = structure.sections?.filter((s) => s.batchId === form.currentBatchId) || [];

  const openAdd = () => {
    setEditId(null);
    setForm({ createPortalAccount: true });
    setError('');
    setOpen(true);
  };

  const openEdit = (s) => {
    setEditId(s.id);
    setForm({
      firstName: s.firstName,
      lastName: s.lastName,
      rollNumber: s.rollNumber || '',
      gender: s.gender || '',
      phone: s.phone || '',
      guardianName: s.guardianName || '',
      guardianPhone: s.guardianPhone || '',
      currentBatchId: s.currentBatchId || '',
      currentSectionId: s.currentSectionId || '',
      status: s.status || 'ACTIVE',
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
          await api.put(`/admin/students/${editId}`, form);
        } else {
          const res = await api.post('/admin/students', form);
          const creds = res.data.data?.portalCredentials;
          if (creds?.email) {
            setRevealedCreds(creds);
          }
        }
        setOpen(false);
        setForm({ createPortalAccount: true });
        load();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to save student');
        throw err;
      }
    });
    if (skipped) setError('Please wait, saving...');
  };

  const handleDelete = async (s) => {
    if (!confirmDelete(`Delete student ${s.firstName} ${s.lastName}?`)) return;
    try {
      await api.delete(`/admin/students/${s.id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <PageTitle title="Students" />
        <Button onClick={openAdd}>+ Add Student</Button>
      </div>
      {error && !open && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Roll #</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Class</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Section</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Portal Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Password</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No students found</td></tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{s.rollNumber || '—'}</td>
                  <td className="px-4 py-3 text-sm">{s.firstName} {s.lastName}</td>
                  <td className="px-4 py-3 text-sm">{s.currentBatch?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm">{s.currentSection?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{s.user?.email || '—'}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-700">
                    {s.user?.portalPassword || <span className="font-sans text-gray-400 italic">—</span>}
                  </td>
                  <td className="px-4 py-3"><Badge variant="success">{s.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" className="px-2 py-1 text-xs" onClick={() => setDocsFor(s)}>Documents</Button>
                      <RowActions onEdit={() => openEdit(s)} onDelete={() => handleDelete(s)} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Edit Student' : 'Add Student'} wide>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
          <Input label="First Name *" value={form.firstName || ''} onChange={(e) => set('firstName', e.target.value)} required />
          <Input label="Last Name *" value={form.lastName || ''} onChange={(e) => set('lastName', e.target.value)} required />
          <Input label="Roll Number" value={form.rollNumber || ''} onChange={(e) => set('rollNumber', e.target.value)} />
          <Select label="Gender" value={form.gender || ''} onChange={(e) => set('gender', e.target.value)}>
            <option value="">—</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </Select>
          <Select label="Class/Batch" value={form.currentBatchId || ''} onChange={(e) => { set('currentBatchId', e.target.value); set('currentSectionId', ''); }}>
            <option value="">Select class</option>
            {structure.batches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <Select label="Section" value={form.currentSectionId || ''} onChange={(e) => set('currentSectionId', e.target.value)}>
            <option value="">Select section</option>
            {sectionsForBatch.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          {editId && (
            <Select label="Status" value={form.status || 'ACTIVE'} onChange={(e) => set('status', e.target.value)}>
              {STATUS_OPTIONS.map((st) => <option key={st} value={st}>{st}</option>)}
            </Select>
          )}
          <Input label="Phone" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
          <Input label="Guardian Name" value={form.guardianName || ''} onChange={(e) => set('guardianName', e.target.value)} />
          <Input label="Guardian Phone" value={form.guardianPhone || ''} onChange={(e) => set('guardianPhone', e.target.value)} />
          {!editId && (
            <>
              <Input label="Portal Email" type="text" value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
              <Input label="Portal Password" type="text" value={form.password || ''} onChange={(e) => set('password', e.target.value)} placeholder="Default: Student@123" />
            </>
          )}
          <div className="col-span-2">
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : editId ? 'Update Student' : 'Create Student'}</Button>
          </div>
        </form>
      </Modal>

      <CredentialsRevealModal
        open={!!revealedCreds}
        title="Student portal credentials"
        email={revealedCreds?.email || ''}
        password={revealedCreds?.password || ''}
        onConfirm={() => setRevealedCreds(null)}
      />

      <Modal open={!!docsFor} onClose={() => setDocsFor(null)} title={`Documents — ${docsFor?.firstName} ${docsFor?.lastName}`} wide>
        {docsFor && (
          <DocumentManager personType="student" personId={docsFor.id} mode="admin" />
        )}
      </Modal>
    </>
  );
}
