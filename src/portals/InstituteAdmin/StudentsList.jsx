import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import PaginatedTable from '../../components/common/PaginatedTable';
import CredentialsRevealModal from '../../components/common/CredentialsRevealModal';
import { EmptyState } from '../../components/layout/DetailPageLayout';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const STATUS_OPTIONS = ['ACTIVE', 'ALUMNI', 'EXPELLED', 'TRANSFERRED'];

export default function StudentsList() {
  const navigate = useNavigate();
  const [structure, setStructure] = useState({ sessions: [], batches: [], sections: [] });
  const [filters, setFilters] = useState({ sessionId: '', batchId: '', sectionId: '', search: '' });
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ createPortalAccount: true });
  const [error, setError] = useState('');
  const [revealedCreds, setRevealedCreds] = useState(null);
  const [feePreview, setFeePreview] = useState(null);
  const { submitting, run } = useAsyncSubmit();

  useEffect(() => {
    api.get('/admin/academic/structure').then((res) => {
      const d = res.data.data || {};
      setStructure({ sessions: d.sessions || [], batches: d.batches || [], sections: d.sections || [] });
    });
  }, []);

  const batchesForSession = structure.batches.filter((b) => !filters.sessionId || b.sessionId === filters.sessionId);
  const sectionsForBatch = structure.sections.filter((s) => !filters.batchId || s.batchId === filters.batchId);
  const formSections = structure.sections.filter((s) => !form.currentBatchId || s.batchId === form.currentBatchId);
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

  const openAdd = () => {
    setEditId(null);
    setForm({
      createPortalAccount: true,
      currentBatchId: filters.batchId || '',
      currentSectionId: filters.sectionId || '',
      registrationDiscount: 0,
      monthlyDiscount: 0,
    });
    setFeePreview(null);
    setError('');
    setOpen(true);
    if (filters.batchId) loadFeePreview(filters.batchId);
  };

  const loadFeePreview = (batchId) => {
    if (!batchId) { setFeePreview(null); return; }
    api.get('/admin/students/fee-preview', { params: { batchId } })
      .then((res) => setFeePreview(res.data.data))
      .catch(() => setFeePreview(null));
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setBatch = (batchId) => {
    set('currentBatchId', batchId);
    set('currentSectionId', '');
    loadFeePreview(batchId);
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
    setFeePreview(null);
    setError('');
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    await run(async () => {
      try {
        if (editId) {
          await api.put(`/admin/students/${editId}`, form);
          setOpen(false);
          loadStudents(pagination.page || 1);
        } else {
          const res = await api.post('/admin/students', form);
          const creds = res.data.data?.portalCredentials;
          if (creds?.email) setRevealedCreds(creds);
          setOpen(false);
          if (form.currentBatchId === filters.batchId && form.currentSectionId === filters.sectionId) {
            loadStudents(1);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to save student');
        throw err;
      }
    });
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete ${s.firstName} ${s.lastName}?`)) return;
    await api.delete(`/admin/students/${s.id}`);
    loadStudents(pagination.page || 1);
  };

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
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button type="button" variant="ghost" className="text-xs" onClick={() => navigate(`/admin/students/${s.id}`)}>Profile</Button>
          <Button type="button" variant="ghost" className="text-xs" onClick={() => openEdit(s)}>Edit</Button>
          <Button type="button" variant="ghost" className="text-xs text-red-600" onClick={() => handleDelete(s)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/admin' }, { label: 'Students' }]} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PageTitle title="Students" subtitle="Select session, class, and section to browse students" />
        <Button onClick={openAdd}>+ Add Student</Button>
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
        <EmptyState title="Select class and section" message="Choose session, class, and section above — or use Add Student anytime." />
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

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Edit Student' : 'Add Student'} wide>
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-800">Personal Information</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="First Name *" value={form.firstName || ''} onChange={(e) => set('firstName', e.target.value)} required />
              <Input label="Last Name *" value={form.lastName || ''} onChange={(e) => set('lastName', e.target.value)} required />
              <Input label="Date of Birth" type="date" value={form.dateOfBirth || ''} onChange={(e) => set('dateOfBirth', e.target.value)} />
              <Select label="Gender" value={form.gender || ''} onChange={(e) => set('gender', e.target.value)}>
                <option value="">—</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </Select>
              <Input label="CNIC / B-Form" value={form.cnic || ''} onChange={(e) => set('cnic', e.target.value)} />
              <Input label="Blood Group" value={form.bloodGroup || ''} onChange={(e) => set('bloodGroup', e.target.value)} />
              <Input label="Photo URL" value={form.photo || ''} onChange={(e) => set('photo', e.target.value)} className="sm:col-span-2" />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-800">Student Details</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Roll Number" value={form.rollNumber || ''} onChange={(e) => set('rollNumber', e.target.value)} />
              <Input label="Admission Number" value={form.admissionNumber || ''} onChange={(e) => set('admissionNumber', e.target.value)} />
              <Select label="Class/Batch" value={form.currentBatchId || ''} onChange={(e) => setBatch(e.target.value)}>
                <option value="">Select class</option>
                {structure.batches.map((b) => <option key={b.id} value={b.id}>{b.name}{b.academicClass ? ` (${b.academicClass.name})` : ''}</option>)}
              </Select>
              <Select label="Section" value={form.currentSectionId || ''} onChange={(e) => set('currentSectionId', e.target.value)}>
                <option value="">Select section</option>
                {formSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              {editId && (
                <Select label="Status" value={form.status || 'ACTIVE'} onChange={(e) => set('status', e.target.value)}>
                  {STATUS_OPTIONS.map((st) => <option key={st} value={st}>{st}</option>)}
                </Select>
              )}
            </div>
          </div>
          {!editId && feePreview && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm">
              <p className="mb-2 font-medium text-blue-900">Fees from class: {feePreview.className || '—'}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <p>Registration Fee: <strong>{Number(feePreview.registrationFee).toLocaleString()} PKR</strong> (original)</p>
                <p>Monthly Fee: <strong>{Number(feePreview.monthlyFee).toLocaleString()} PKR</strong> (original)</p>
                <Input label="Registration Discount" type="number" value={form.registrationDiscount ?? 0}
                  onChange={(e) => set('registrationDiscount', e.target.value)} />
                <Input label="Monthly Discount" type="number" value={form.monthlyDiscount ?? 0}
                  onChange={(e) => set('monthlyDiscount', e.target.value)} />
              </div>
              <p className="mt-2 text-xs text-blue-800">
                Final payable — Registration: {Math.max(0, Number(feePreview.registrationFee) - Number(form.registrationDiscount || 0)).toLocaleString()} PKR
                · Monthly: {Math.max(0, Number(feePreview.monthlyFee) - Number(form.monthlyDiscount || 0)).toLocaleString()} PKR
              </p>
            </div>
          )}
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-800">Guardian / Father Information</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Father Name" value={form.fatherName || ''} onChange={(e) => set('fatherName', e.target.value)} />
              <Input label="Mother Name" value={form.motherName || ''} onChange={(e) => set('motherName', e.target.value)} />
              <Input label="Guardian Name" value={form.guardianName || ''} onChange={(e) => set('guardianName', e.target.value)} />
              <Input label="Guardian Relation" value={form.guardianRelation || ''} onChange={(e) => set('guardianRelation', e.target.value)} />
              <Input label="Guardian Phone" value={form.guardianPhone || ''} onChange={(e) => set('guardianPhone', e.target.value)} />
              <Input label="Guardian Email" type="email" value={form.guardianEmail || ''} onChange={(e) => set('guardianEmail', e.target.value)} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-800">Contact & Address</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Phone" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
              <Input label="Address" value={form.address || ''} onChange={(e) => set('address', e.target.value)} className="sm:col-span-2" />
            </div>
          </div>
          {!editId && (
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-800">Portal Access</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Portal Email" type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
                <Input label="Portal Password" type="text" value={form.password || ''} onChange={(e) => set('password', e.target.value)} placeholder="Default: Student@123" />
              </div>
            </div>
          )}
          <Input label="Notes" value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} />
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : editId ? 'Update Student' : 'Create Student'}</Button>
        </form>
      </Modal>

      <CredentialsRevealModal
        open={!!revealedCreds}
        title="Student portal credentials"
        email={revealedCreds?.email || ''}
        password={revealedCreds?.password || ''}
        onConfirm={() => setRevealedCreds(null)}
      />
    </>
  );
}
