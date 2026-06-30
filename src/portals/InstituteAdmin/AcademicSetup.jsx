import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import { RowActions, confirmDelete } from '../../components/common/RowActions';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const PATHS = {
  session: 'sessions', semester: 'semesters', department: 'departments',
  course: 'courses', subject: 'subjects', batch: 'batches', section: 'sections',
};

function toDateInput(d) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

export default function AcademicSetup() {
  const [data, setData] = useState({ sessions: [], semesters: [], departments: [], batches: [], sections: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const { submitting, run } = useAsyncSubmit();

  const load = () => {
    setLoading(true);
    api.get('/admin/academic/structure')
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = (type, defaults = {}) => {
    setModal(type);
    setEditId(null);
    setForm(defaults);
    setError('');
  };

  const openEdit = (type, item) => {
    setModal(type);
    setEditId(item.id);
    setError('');
    if (type === 'session') {
      setForm({ name: item.name, startDate: toDateInput(item.startDate), endDate: toDateInput(item.endDate), isActive: item.isActive });
    } else if (type === 'semester') {
      setForm({ sessionId: item.sessionId, name: item.name, number: item.number, startDate: toDateInput(item.startDate), endDate: toDateInput(item.endDate) });
    } else if (type === 'department') {
      setForm({ name: item.name, code: item.code });
    } else if (type === 'course') {
      setForm({ departmentId: item.departmentId, name: item.name, code: item.code, creditHours: item.creditHours });
    } else if (type === 'subject') {
      setForm({ courseId: item.courseId, name: item.name, code: item.code, creditHours: item.creditHours });
    } else if (type === 'batch') {
      setForm({ name: item.name, year: item.year, sessionId: item.sessionId || '' });
    } else if (type === 'section') {
      setForm({ batchId: item.batchId, name: item.name, capacity: item.capacity });
    }
  };

  const closeModal = () => { setModal(null); setEditId(null); setForm({}); setError(''); };

  const submit = async (type) => {
    setMsg('');
    setError('');
    const { skipped } = await run(async () => {
      const path = PATHS[type];
      try {
        if (editId) {
          await api.put(`/admin/academic/${path}/${editId}`, form);
          setMsg('Updated successfully');
        } else {
          await api.post(`/admin/academic/${path}`, form);
          setMsg('Saved successfully');
        }
        closeModal();
        load();
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to save');
        throw e;
      }
    });
    if (skipped) setError('Please wait, saving...');
  };

  const remove = async (type, id, label) => {
    if (!confirmDelete(`Delete ${label}?`)) return;
    setError('');
    try {
      await api.delete(`/admin/academic/${PATHS[type]}/${id}`);
      setMsg('Deleted successfully');
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete');
    }
  };

  const modalTitle = `${editId ? 'Edit' : 'Add'} ${modal}`;

  return (
    <>
      <PageTitle title="Academic Setup" subtitle="Sessions, classes, departments, courses & subjects" />
      {msg && <p className="mb-2 text-sm text-green-600">{msg}</p>}
      {error && !modal && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="mb-6 flex flex-wrap gap-2">
        <Button onClick={() => openAdd('session', { isActive: true })}>+ Session</Button>
        <Button variant="secondary" onClick={() => openAdd('semester')}>+ Semester</Button>
        <Button variant="secondary" onClick={() => openAdd('department')}>+ Department</Button>
        <Button variant="secondary" onClick={() => openAdd('course')}>+ Course</Button>
        <Button variant="secondary" onClick={() => openAdd('subject')}>+ Subject</Button>
        <Button variant="secondary" onClick={() => openAdd('batch')}>+ Class/Batch</Button>
        <Button variant="secondary" onClick={() => openAdd('section', { capacity: 40 })}>+ Section</Button>
      </div>

      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Sessions">
            <ul className="divide-y divide-gray-100 text-sm">
              {data.sessions?.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                  <span>{s.name} {s.isActive && <span className="text-xs text-green-600">(Active)</span>}</span>
                  <RowActions onEdit={() => openEdit('session', s)} onDelete={() => remove('session', s.id, s.name)} />
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Semesters">
            <ul className="divide-y divide-gray-100 text-sm">
              {data.semesters?.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                  <span>{s.session?.name} — {s.name} (#{s.number})</span>
                  <RowActions onEdit={() => openEdit('semester', s)} onDelete={() => remove('semester', s.id, s.name)} />
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Classes / Batches">
            <ul className="divide-y divide-gray-100 text-sm">
              {data.batches?.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2 py-2">
                  <span>{b.name} {b.session?.name && <span className="text-gray-400">({b.session.name})</span>}</span>
                  <RowActions onEdit={() => openEdit('batch', b)} onDelete={() => remove('batch', b.id, b.name)} />
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Sections">
            <ul className="divide-y divide-gray-100 text-sm">
              {data.sections?.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                  <span>{s.batch?.name} — Section {s.name} (cap: {s.capacity})</span>
                  <RowActions onEdit={() => openEdit('section', s)} onDelete={() => remove('section', s.id, `Section ${s.name}`)} />
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Departments, Courses & Subjects" className="lg:col-span-2">
            {data.departments?.map((d) => (
              <div key={d.id} className="mb-4 border-b border-gray-100 pb-3 last:border-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{d.name} ({d.code})</p>
                  <RowActions onEdit={() => openEdit('department', d)} onDelete={() => remove('department', d.id, d.name)} />
                </div>
                {d.courses?.map((c) => (
                  <div key={c.id} className="ml-4 mt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{c.name} ({c.code})</span>
                      <RowActions onEdit={() => openEdit('course', { ...c, departmentId: d.id })} onDelete={() => remove('course', c.id, c.name)} />
                    </div>
                    <div className="ml-4 mt-1 space-y-1">
                      {c.subjects?.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between text-xs text-gray-600">
                          <span>{sub.name} ({sub.code})</span>
                          <RowActions onEdit={() => openEdit('subject', { ...sub, courseId: c.id })} onDelete={() => remove('subject', sub.id, sub.name)} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </Card>
        </div>
      )}

      <Modal open={!!modal} onClose={closeModal} title={modalTitle}>
        {error && modal && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {modal === 'session' && (
          <div className="space-y-3">
            <Input label="Name" value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="2024-2025" />
            <Input label="Start Date" type="date" value={form.startDate || ''} onChange={(e) => set('startDate', e.target.value)} />
            <Input label="End Date" type="date" value={form.endDate || ''} onChange={(e) => set('endDate', e.target.value)} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Set as active session</label>
            <Button disabled={submitting} onClick={() => submit('session')}>{submitting ? 'Saving...' : editId ? 'Update' : 'Save'}</Button>
          </div>
        )}
        {modal === 'semester' && (
          <div className="space-y-3">
            <Select label="Session" value={form.sessionId || ''} onChange={(e) => set('sessionId', e.target.value)}>
              <option value="">Select session</option>
              {data.sessions?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Input label="Name" value={form.name || ''} onChange={(e) => set('name', e.target.value)} />
            <Input label="Number" type="number" value={form.number ?? ''} onChange={(e) => set('number', Number(e.target.value))} />
            <Input label="Start Date" type="date" value={form.startDate || ''} onChange={(e) => set('startDate', e.target.value)} />
            <Input label="End Date" type="date" value={form.endDate || ''} onChange={(e) => set('endDate', e.target.value)} />
            <Button disabled={submitting} onClick={() => submit('semester')}>{submitting ? 'Saving...' : editId ? 'Update' : 'Save'}</Button>
          </div>
        )}
        {modal === 'department' && (
          <div className="space-y-3">
            <Input label="Name" value={form.name || ''} onChange={(e) => set('name', e.target.value)} />
            <Input label="Code" value={form.code || ''} onChange={(e) => set('code', e.target.value)} />
            <Button disabled={submitting} onClick={() => submit('department')}>{submitting ? 'Saving...' : editId ? 'Update' : 'Save'}</Button>
          </div>
        )}
        {modal === 'course' && (
          <div className="space-y-3">
            <Select label="Department" value={form.departmentId || ''} onChange={(e) => set('departmentId', e.target.value)}>
              <option value="">Select department</option>
              {data.departments?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Input label="Name" value={form.name || ''} onChange={(e) => set('name', e.target.value)} />
            <Input label="Code" value={form.code || ''} onChange={(e) => set('code', e.target.value)} />
            <Button disabled={submitting} onClick={() => submit('course')}>{submitting ? 'Saving...' : editId ? 'Update' : 'Save'}</Button>
          </div>
        )}
        {modal === 'subject' && (
          <div className="space-y-3">
            <Select label="Course" value={form.courseId || ''} onChange={(e) => set('courseId', e.target.value)}>
              <option value="">Select course</option>
              {data.departments?.flatMap((d) => d.courses?.map((c) => (
                <option key={c.id} value={c.id}>{d.name} — {c.name}</option>
              )) || [])}
            </Select>
            <Input label="Subject Name" value={form.name || ''} onChange={(e) => set('name', e.target.value)} />
            <Input label="Code" value={form.code || ''} onChange={(e) => set('code', e.target.value)} />
            <Button disabled={submitting} onClick={() => submit('subject')}>{submitting ? 'Saving...' : editId ? 'Update' : 'Save'}</Button>
          </div>
        )}
        {modal === 'batch' && (
          <div className="space-y-3">
            <Input label="Class/Batch Name" value={form.name || ''} onChange={(e) => set('name', e.target.value)} />
            <Input label="Year" type="number" value={form.year ?? ''} onChange={(e) => set('year', Number(e.target.value))} />
            <Select label="Session" value={form.sessionId || ''} onChange={(e) => set('sessionId', e.target.value)}>
              <option value="">Optional</option>
              {data.sessions?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Button disabled={submitting} onClick={() => submit('batch')}>{submitting ? 'Saving...' : editId ? 'Update' : 'Save'}</Button>
          </div>
        )}
        {modal === 'section' && (
          <div className="space-y-3">
            <Select label="Batch/Class" value={form.batchId || ''} onChange={(e) => set('batchId', e.target.value)}>
              <option value="">Select batch</option>
              {data.batches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
            <Input label="Section" value={form.name || ''} onChange={(e) => set('name', e.target.value)} />
            <Input label="Capacity" type="number" value={form.capacity ?? ''} onChange={(e) => set('capacity', Number(e.target.value))} />
            <Button disabled={submitting} onClick={() => submit('section')}>{submitting ? 'Saving...' : editId ? 'Update' : 'Save'}</Button>
          </div>
        )}
      </Modal>
    </>
  );
}

function Card({ title, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}>
      <h3 className="mb-3 font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}
