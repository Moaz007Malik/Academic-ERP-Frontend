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
      {msg && <p className="mb-2 text-sm text-green-600">{msg}</p>}
      {error && !modal && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="mb-6 flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <button key={label} type="button" onClick={() => setStep(i)}
            className={`rounded-full px-4 py-2 text-sm ${step === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {i + 1}. {label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
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

      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="grid gap-6 lg:grid-cols-2">
          {step === 0 && (
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
          )}

          {step === 1 && (
            <Card title="Departments" className="lg:col-span-2">
              <ul className="divide-y divide-gray-100 text-sm">
                {data.departments?.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                    <span>{d.name} ({d.code})</span>
                    <RowActions onEdit={() => openEdit('department', d)} onDelete={() => remove('department', d.id, d.name)} />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {step === 2 && (
            <Card title="Classes & Subjects" className="lg:col-span-2">
              {!data.classes?.length && <p className="text-sm text-gray-500">No classes yet. Create a class to add subjects and fees.</p>}
              {data.classes?.map((cls) => (
                <div key={cls.id} className="mb-4 border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{cls.name} <span className="text-gray-400">({cls.department?.name})</span></p>
                      <p className="text-xs text-gray-500">
                        Registration: {Number(cls.registrationFee).toLocaleString()} PKR · Monthly: {Number(cls.monthlyFee).toLocaleString()} PKR
                        · {cls.subjects?.length || 0} subjects · {cls._count?.batches || 0} batches
                      </p>
                    </div>
                    <RowActions onEdit={() => openEdit('class', cls)} onDelete={() => remove('class', cls.id, cls.name)} />
                  </div>
                  <div className="ml-3 mt-2 space-y-1">
                    {cls.subjects?.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between text-xs text-gray-600">
                        <span>{sub.name} ({sub.code})</span>
                        <RowActions onEdit={() => openEdit('subject', { ...sub, classId: cls.id })} onDelete={() => remove('subject', sub.id, sub.name)} />
                      </div>
                    ))}
                    <button type="button" className="text-xs text-blue-600" onClick={() => openAdd('subject', { classId: cls.id })}>+ Add subject</button>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {step === 3 && (
            <>
              <Card title="Batches">
                <ul className="divide-y divide-gray-100 text-sm">
                  {data.batches?.map((b) => (
                    <li key={b.id} className="py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{b.name}</p>
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
                <ul className="divide-y divide-gray-100 text-sm">
                  {data.sections?.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                      <span>{s.batch?.name} — Section {s.name} {s.capacity != null && `(cap: ${s.capacity})`}</span>
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

        {modal === 'department' && (
          <div className="space-y-3">
            <Input label="Name" value={form.name || ''} onChange={(e) => set('name', e.target.value)} />
            <Input label="Code" value={form.code || ''} onChange={(e) => set('code', e.target.value)} />
            <Button disabled={submitting} onClick={() => submit('department')}>{submitting ? 'Saving...' : editId ? 'Update' : 'Save'}</Button>
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
            <Input label="Registration Fee (PKR)" type="number" value={form.registrationFee ?? 0} onChange={(e) => set('registrationFee', e.target.value)} />
            <Input label="Monthly Fee (PKR)" type="number" value={form.monthlyFee ?? 0} onChange={(e) => set('monthlyFee', e.target.value)} />
            <p className="text-xs text-gray-500">These fees apply to all batches under this class. Students inherit them automatically on admission.</p>
            <Button disabled={submitting} onClick={() => submit('class')}>{submitting ? 'Saving...' : editId ? 'Update' : 'Save'}</Button>
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
            <p className="text-xs text-gray-500">All batches of this class automatically use these subjects.</p>
            <Button disabled={submitting} onClick={() => submit('subject')}>{submitting ? 'Saving...' : editId ? 'Update' : 'Save'}</Button>
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
              <div className="rounded bg-blue-50 p-3 text-xs text-blue-800">
                <p className="font-medium">Inherited from {selectedClass.name}</p>
                <p>Fees: Reg {Number(selectedClass.registrationFee).toLocaleString()} · Monthly {Number(selectedClass.monthlyFee).toLocaleString()} PKR</p>
                <p>Subjects: {selectedClass.subjects?.map((s) => s.name).join(', ') || 'None yet'}</p>
              </div>
            )}
            <Input label="Batch Name *" value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="e.g. 9th Morning 2025" />
            {!editId && (
              <>
                <Input label="Section Name (optional)" value={form.sectionName || ''} onChange={(e) => set('sectionName', e.target.value)} placeholder="e.g. A" />
                <Input label="Capacity" type="number" value={form.capacity ?? ''} onChange={(e) => set('capacity', e.target.value)} />
              </>
            )}
            <Button disabled={submitting} onClick={() => submit('batch')}>{submitting ? 'Saving...' : editId ? 'Update' : 'Save'}</Button>
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
