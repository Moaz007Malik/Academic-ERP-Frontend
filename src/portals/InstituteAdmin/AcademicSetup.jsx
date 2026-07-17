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
  session: 'sessions',
  department: 'departments',
  class: 'classes',
  subject: 'subjects',
  batch: 'batches',
  section: 'sections',
};

function toDateInput(d) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

export default function AcademicSetup() {
  const [step, setStep] = useState(0);
  const STEPS = ['Sessions', 'Departments', 'Classes & Subjects', 'Batches / Sections'];
  const [data, setData] = useState({ sessions: [], departments: [], classes: [], batches: [], sections: [] });
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
      .then((res) => setData(res.data.data || {}))
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
    } else if (type === 'department') {
      setForm({ name: item.name, code: item.code });
    } else if (type === 'class') {
      setForm({
        departmentId: item.departmentId,
        name: item.name,
        code: item.code || '',
        registrationFee: Number(item.registrationFee || 0),
        monthlyFee: Number(item.monthlyFee || 0),
      });
    } else if (type === 'subject') {
      setForm({ classId: item.classId, name: item.name, code: item.code, creditHours: item.creditHours });
    } else if (type === 'batch') {
      setForm({
        name: item.name,
        year: item.year || '',
        sessionId: item.sessionId || '',
        classId: item.classId || '',
      });
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

  const selectedClass = data.classes?.find((c) => c.id === form.classId);

  return (
    <>
      <PageTitle title="Academic Setup" subtitle="Session → Department → Class → Subjects → Batch/Section" />
      {msg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800">
          <span>✓</span> {msg}
        </div>
      )}
      {error && !modal && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <button key={label} type="button" onClick={() => setStep(i)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${step === i ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${step === i ? 'bg-white/25' : 'bg-white text-gray-500'}`}>{i + 1}</span>
            {label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        {step === 0 && <Button onClick={() => openAdd('session', { isActive: true })}>+ Session</Button>}
        {step === 1 && <Button onClick={() => openAdd('department')}>+ Department</Button>}
        {step === 2 && (
          <>
            <Button onClick={() => openAdd('class', { registrationFee: 0, monthlyFee: 0 })}>+ Class</Button>
            <Button variant="secondary" onClick={() => openAdd('subject')}>+ Subject</Button>
          </>
        )}
        {step === 3 && (
          <>
            <Button onClick={() => openAdd('batch', { capacity: 40 })}>+ Batch / Section</Button>
            <Button variant="secondary" onClick={() => openAdd('section', { capacity: 40 })}>+ Section only</Button>
          </>
        )}
        {step < STEPS.length - 1 && (
          <Button variant="secondary" className="ml-auto" onClick={() => setStep((s) => s + 1)}>Next Step →</Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {step === 0 && (
            <Card title="Sessions">
              {!data.sessions?.length && <p className="py-6 text-center text-sm text-gray-400">No sessions yet.</p>}
              <ul className="divide-y divide-gray-100 text-sm">
                {data.sessions?.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 py-3">
                    <span className="flex items-center gap-2">
                      {s.name}
                      {s.isActive && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>}
                    </span>
                    <RowActions onEdit={() => openEdit('session', s)} onDelete={() => remove('session', s.id, s.name)} />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {step === 1 && (
            <Card title="Departments" className="lg:col-span-2">
              {!data.departments?.length && <p className="py-6 text-center text-sm text-gray-400">No departments yet.</p>}
              <ul className="divide-y divide-gray-100 text-sm">
                {data.departments?.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 py-3">
                    <span className="font-medium text-gray-800">{d.name} <span className="font-normal text-gray-400">({d.code})</span></span>
                    <RowActions onEdit={() => openEdit('department', d)} onDelete={() => remove('department', d.id, d.name)} />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {step === 2 && (
            <Card title="Classes & Subjects" className="lg:col-span-2">
              {!data.classes?.length && <p className="py-6 text-center text-sm text-gray-400">No classes yet. Create a class to add subjects and fees.</p>}
              {data.classes?.map((cls) => (
                <div key={cls.id} className="mb-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 last:mb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">{cls.name} <span className="font-normal text-gray-400">({cls.department?.name})</span></p>
                      <p className="mt-1 text-xs text-gray-500">
                        Registration: <span className="font-medium text-gray-700">{Number(cls.registrationFee).toLocaleString()} PKR</span> · Monthly: <span className="font-medium text-gray-700">{Number(cls.monthlyFee).toLocaleString()} PKR</span>
                        {' '}· {cls.subjects?.length || 0} subjects · {cls._count?.batches || 0} batches
                      </p>
                    </div>
                    <RowActions onEdit={() => openEdit('class', cls)} onDelete={() => remove('class', cls.id, cls.name)} />
                  </div>
                  <div className="ml-3 mt-3 space-y-1.5 border-l-2 border-gray-200 pl-3">
                    {cls.subjects?.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between text-xs text-gray-600">
                        <span>{sub.name} <span className="text-gray-400">({sub.code})</span></span>
                        <RowActions onEdit={() => openEdit('subject', { ...sub, classId: cls.id })} onDelete={() => remove('subject', sub.id, sub.name)} />
                      </div>
                    ))}
                    <button type="button" className="text-xs font-medium text-primary-600 hover:underline" onClick={() => openAdd('subject', { classId: cls.id })}>+ Add subject</button>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {step === 3 && (
            <>
              <Card title="Batches">
                {!data.batches?.length && <p className="py-6 text-center text-sm text-gray-400">No batches yet.</p>}
                <ul className="divide-y divide-gray-100 text-sm">
                  {data.batches?.map((b) => (
                    <li key={b.id} className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900">{b.name}</p>
                          <p className="text-xs text-gray-500">
                            {b.session?.name} · {b.academicClass?.department?.name} · {b.academicClass?.name || 'No class'}
                          </p>
                          {b.academicClass?.subjects?.length > 0 && (
                            <p className="mt-1 text-xs text-gray-400">
                              Subjects: {b.academicClass.subjects.map((s) => s.name).join(', ')}
                            </p>
                          )}
                        </div>
                        <RowActions onEdit={() => openEdit('batch', b)} onDelete={() => remove('batch', b.id, b.name)} />
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title="Sections">
                {!data.sections?.length && <p className="py-6 text-center text-sm text-gray-400">No sections yet.</p>}
                <ul className="divide-y divide-gray-100 text-sm">
                  {data.sections?.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 py-3">
                      <span>{s.batch?.name} — Section <span className="font-medium">{s.name}</span> {s.capacity != null && <span className="text-xs text-gray-400">(cap: {s.capacity})</span>}</span>
                      <RowActions onEdit={() => openEdit('section', s)} onDelete={() => remove('section', s.id, `Section ${s.name}`)} />
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}
        </div>
      )}

      <Modal open={!!modal} onClose={closeModal} title={`${editId ? 'Edit' : 'Add'} ${modal}`}>
        {error && modal && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {modal === 'session' && (
          <div className="space-y-3">
            <Input label="Name" value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="2024-2025" />
            <Input label="Start Date" type="date" value={form.startDate || ''} onChange={(e) => set('startDate', e.target.value)} />
            <Input label="End Date" type="date" value={form.endDate || ''} onChange={(e) => set('endDate', e.target.value)} />
            <label className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded text-primary-600" checked={!!form.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Set as active session
            </label>
            <Button disabled={submitting} onClick={() => submit('session')} className="w-full sm:w-auto">{submitting ? 'Saving...' : editId ? 'Update' : 'Save'}</Button>
          </div>
        )}

        {modal === 'department' && (
          <div className="space-y-3">
            <Input label="Name" value={form.name || ''} onChange={(e) => set('name', e.target.value)} />
            <Input label="Code" value={form.code || ''} onChange={(e) => set('code', e.target.value)} />
            <Button disabled={submitting} onClick={() => submit('department')} className="w-full sm:w-auto">{submitting ? 'Saving...' : editId ? 'Update' : 'Save'}</Button>
          </div>
        )}

        {modal === 'class' && (
          <div className="space-y-3">
            <Select label="Department *" value={form.departmentId || ''} onChange={(e) => set('departmentId', e.target.value)}>
              <option value="">Select department</option>
              {data.departments?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Input label="Class Name *" value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="e.g. 9th, Nursery, First Year" />
            <Input label="Code" value={form.code || ''} onChange={(e) => set('code', e.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Registration Fee (PKR)" type="number" value={form.registrationFee ?? 0} onChange={(e) => set('registrationFee', e.target.value)} />
              <Input label="Monthly Fee (PKR)" type="number" value={form.monthlyFee ?? 0} onChange={(e) => set('monthlyFee', e.target.value)} />
            </div>
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">These fees apply to all batches under this class. Students inherit them automatically on admission.</p>
            <Button disabled={submitting} onClick={() => submit('class')} className="w-full sm:w-auto">{submitting ? 'Saving...' : editId ? 'Update' : 'Save'}</Button>
          </div>
        )}

        {modal === 'subject' && (
          <div className="space-y-3">
            <Select label="Class *" value={form.classId || ''} onChange={(e) => set('classId', e.target.value)}>
              <option value="">Select class</option>
              {data.classes?.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.department?.name})</option>)}
            </Select>
            <Input label="Subject Name *" value={form.name || ''} onChange={(e) => set('name', e.target.value)} />
            <Input label="Code *" value={form.code || ''} onChange={(e) => set('code', e.target.value)} />
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">All batches of this class automatically use these subjects.</p>
            <Button disabled={submitting} onClick={() => submit('subject')} className="w-full sm:w-auto">{submitting ? 'Saving...' : editId ? 'Update' : 'Save'}</Button>
          </div>
        )}

        {modal === 'batch' && (
          <div className="space-y-3">
            <Select label="Academic Session *" value={form.sessionId || ''} onChange={(e) => set('sessionId', e.target.value)}>
              <option value="">Select session</option>
              {data.sessions?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Select label="Department *" value={form.departmentId || selectedClass?.departmentId || ''} onChange={(e) => { set('departmentId', e.target.value); set('classId', ''); }}>
              <option value="">Select department</option>
              {data.departments?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Select label="Class *" value={form.classId || ''} onChange={(e) => set('classId', e.target.value)}>
              <option value="">Select class</option>
              {(form.departmentId || selectedClass?.departmentId
                ? data.classes?.filter((c) => c.departmentId === (form.departmentId || selectedClass?.departmentId))
                : data.classes)?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            {selectedClass && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-800">
                <p className="font-semibold">Inherited from {selectedClass.name}</p>
                <p className="mt-1">Fees: Reg {Number(selectedClass.registrationFee).toLocaleString()} · Monthly {Number(selectedClass.monthlyFee).toLocaleString()} PKR</p>
                <p>Subjects: {selectedClass.subjects?.map((s) => s.name).join(', ') || 'None yet'}</p>
              </div>
            )}
            <Input label="Batch Name *" value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="e.g. 9th Morning 2025" />
            {!editId && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Section Name (optional)" value={form.sectionName || ''} onChange={(e) => set('sectionName', e.target.value)} placeholder="e.g. A" />
                <Input label="Capacity" type="number" value={form.capacity ?? ''} onChange={(e) => set('capacity', e.target.value)} />
              </div>
            )}
            <Button disabled={submitting} onClick={() => submit('batch')} className="w-full sm:w-auto">{submitting ? 'Saving...' : editId ? 'Update' : 'Save'}</Button>
          </div>
        )}

        {modal === 'section' && (
          <div className="space-y-3">
            <Select label="Batch *" value={form.batchId || ''} onChange={(e) => set('batchId', e.target.value)}>
              <option value="">Select batch</option>
              {data.batches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
            <Input label="Section *" value={form.name || ''} onChange={(e) => set('name', e.target.value)} />
            <Input label="Capacity" type="number" value={form.capacity ?? ''} onChange={(e) => set('capacity', e.target.value)} />
            <Button disabled={submitting} onClick={() => submit('section')} className="w-full sm:w-auto">{submitting ? 'Saving...' : editId ? 'Update' : 'Save'}</Button>
          </div>
        )}
      </Modal>
    </>
  );
}

function Card({ title, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
      <h3 className="mb-3 font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}