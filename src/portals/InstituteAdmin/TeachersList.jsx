import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'RESIGNED'];

export default function TeachersList() {
  const [teachers, setTeachers] = useState([]);
  const [structure, setStructure] = useState({ departments: [], sections: [] });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [assignOpen, setAssignOpen] = useState(null);
  const [docsFor, setDocsFor] = useState(null);
  const [form, setForm] = useState({ createPortalAccount: true });
  const [assignForm, setAssignForm] = useState({});
  const [error, setError] = useState('');
  const [revealedCreds, setRevealedCreds] = useState(null);
  const { submitting, run } = useAsyncSubmit();
  const { submitting: assigning, run: runAssign } = useAsyncSubmit();

  const allSubjects = structure.classes?.flatMap((c) =>
    (c.subjects || []).map((s) => ({ ...s, courseName: c.name, deptName: c.department?.name }))
  ) || [];

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/teachers?limit=100'),
      api.get('/admin/academic/structure'),
    ])
      .then(([tRes, aRes]) => {
        setTeachers(tRes.data.data || []);
        setStructure(aRes.data.data || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditId(null);
    setForm({ createPortalAccount: true });
    setError('');
    setOpen(true);
  };

  const openEdit = (t) => {
    setEditId(t.id);
    setForm({
      firstName: t.firstName,
      lastName: t.lastName,
      employeeCode: t.employeeCode || '',
      qualification: t.qualification || '',
      specialization: t.specialization || '',
      status: t.status || 'ACTIVE',
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
          await api.put(`/admin/teachers/${editId}`, form);
        } else {
          const res = await api.post('/admin/teachers', form);
          const creds = res.data.data?.portalCredentials;
          if (creds?.email) {
            setRevealedCreds(creds);
          }
        }
        setOpen(false);
        setForm({ createPortalAccount: true });
        load();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to save teacher');
        throw err;
      }
    });
    if (skipped) setError('Please wait, saving...');
  };

  const handleDelete = async (t) => {
    if (!confirmDelete(`Delete teacher ${t.firstName} ${t.lastName}?`)) return;
    try {
      await api.delete(`/admin/teachers/${t.id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setError('');
    const { skipped } = await runAssign(async () => {
      try {
        await api.post(`/admin/teachers/${assignOpen.id}/assignments`, assignForm);
        setAssignOpen(null);
        setAssignForm({});
        load();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to assign');
        throw err;
      }
    });
    if (skipped) setError('Please wait...');
  };

  const removeAssignment = async (assignmentId) => {
    if (!confirmDelete('Remove this class/subject assignment?')) return;
    await api.delete(`/admin/teachers/assignments/${assignmentId}`);
    load();
  };

  const initials = (t) => `${(t.firstName || '?')[0]}${(t.lastName || '')[0] || ''}`.toUpperCase();

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <PageTitle title="Teachers" />
        <Button onClick={openAdd} className="shadow-sm">+ Add Teacher</Button>
      </div>
      {error && !open && !assignOpen && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {loading ? <p className="text-sm text-gray-500">Loading...</p> : (
        <div className="space-y-4">
          {!teachers.length && <p className="text-sm text-gray-400">No teachers added yet.</p>}
          {teachers.map((t) => (
            <div key={t.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">
                    {initials(t)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      <Link to={`/admin/teachers/${t.id}`} className="hover:text-primary-700">{t.firstName} {t.lastName}</Link>
                    </h3>
                    <p className="text-sm text-gray-500">{t.employeeCode} · {t.user?.email || 'No portal account'}</p>
                    {t.user?.portalPassword && (
                      <p className="font-mono text-xs text-gray-400">Password: {t.user.portalPassword}</p>
                    )}
                    <p className="text-sm text-gray-500">{t.qualification} {t.specialization && `· ${t.specialization}`}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success">{t.status}</Badge>
                  <Button variant="secondary" className="text-xs" onClick={() => { setAssignOpen(t); setError(''); }}>Assign</Button>
                  <Button variant="ghost" className="text-xs" onClick={() => setDocsFor(t)}>Documents</Button>
                  <RowActions onEdit={() => openEdit(t)} onDelete={() => handleDelete(t)} />
                </div>
              </div>
              {t.assignments?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                  {t.assignments.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs text-primary-800">
                      {a.section?.batch?.name} {a.section?.name} — {a.subject?.name}
                      <button type="button" className="font-bold text-red-500 hover:text-red-700" onClick={() => removeAssignment(a.id)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Edit Teacher' : 'Add Teacher'} wide>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          {error && <p className="col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <Input label="First Name *" value={form.firstName || ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <Input label="Last Name *" value={form.lastName || ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          <Input label="Employee Code" value={form.employeeCode || ''} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} />
          <Input label="Qualification" value={form.qualification || ''} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
          <Input label="Specialization" value={form.specialization || ''} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
          {editId ? (
            <Select label="Status" value={form.status || 'ACTIVE'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUS_OPTIONS.map((st) => <option key={st} value={st}>{st}</option>)}
            </Select>
          ) : (
            <>
              <Input label="Portal Email" type="text" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Portal Password" type="text" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Default: Teacher@123" />
            </>
          )}
          <div className="col-span-2">
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">{submitting ? 'Saving...' : editId ? 'Update Teacher' : 'Create Teacher'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!assignOpen} onClose={() => setAssignOpen(null)} title={`Assign — ${assignOpen?.firstName}`}>
        <form onSubmit={handleAssign} className="space-y-3">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <Select label="Section" value={assignForm.sectionId || ''} onChange={(e) => setAssignForm({ ...assignForm, sectionId: e.target.value })} required>
            <option value="">Select section</option>
            {structure.sections?.map((s) => (
              <option key={s.id} value={s.id}>{s.batch?.name} — Section {s.name}</option>
            ))}
          </Select>
          <Select label="Subject" value={assignForm.subjectId || ''} onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })} required>
            <option value="">Select subject</option>
            {allSubjects.map((s) => (
              <option key={s.id} value={s.id}>{s.deptName} / {s.courseName} — {s.name}</option>
            ))}
          </Select>
          <Button type="submit" disabled={assigning} className="w-full sm:w-auto">{assigning ? 'Assigning...' : 'Assign'}</Button>
        </form>
      </Modal>

      <CredentialsRevealModal
        open={!!revealedCreds}
        title="Teacher portal credentials"
        email={revealedCreds?.email || ''}
        password={revealedCreds?.password || ''}
        onConfirm={() => setRevealedCreds(null)}
      />

      <Modal open={!!docsFor} onClose={() => setDocsFor(null)} title={`Documents — ${docsFor?.firstName} ${docsFor?.lastName}`} wide>
        {docsFor && (
          <DocumentManager personType="teacher" personId={docsFor.id} mode="admin" />
        )}
      </Modal>
    </>
  );
}