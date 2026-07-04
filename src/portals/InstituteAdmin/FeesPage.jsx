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

export default function FeesPage() {
  const [structures, setStructures] = useState([]);
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [feeRequests, setFeeRequests] = useState([]);
  const [tab, setTab] = useState('fees');
  const [openStruct, setOpenStruct] = useState(false);
  const [editStructId, setEditStructId] = useState(null);
  const [openAssign, setOpenAssign] = useState(false);
  const [assignScope, setAssignScope] = useState('INDIVIDUAL');
  const [structForm, setStructForm] = useState({ frequency: 'MONTHLY' });
  const [assignForm, setAssignForm] = useState({});
  const [error, setError] = useState('');
  const { submitting, run } = useAsyncSubmit();

  const load = () => {
    Promise.all([
      api.get('/admin/fees/structures'),
      api.get('/admin/fees'),
      api.get('/admin/students?limit=500'),
      api.get('/admin/academic/structure'),
      api.get('/admin/fees/requests'),
    ]).then(([sRes, fRes, stRes, structRes, rRes]) => {
      setStructures(sRes.data.data || []);
      setFees(fRes.data.data || []);
      setStudents(stRes.data.data || []);
      setBatches(structRes.data.data?.batches || []);
      setFeeRequests(rRes.data.data || []);
    });
  };

  useEffect(() => { load(); }, []);

  const openAddStruct = () => {
    setEditStructId(null);
    setStructForm({ frequency: 'MONTHLY' });
    setError('');
    setOpenStruct(true);
  };

  const openEditStruct = (s) => {
    setEditStructId(s.id);
    setStructForm({ name: s.name, amount: Number(s.amount), frequency: s.frequency || 'MONTHLY' });
    setError('');
    setOpenStruct(true);
  };

  const saveStructure = async (e) => {
    e.preventDefault();
    setError('');
    const { skipped } = await run(async () => {
      try {
        if (editStructId) {
          await api.put(`/admin/fees/structures/${editStructId}`, structForm);
        } else {
          await api.post('/admin/fees/structures', structForm);
        }
        setOpenStruct(false);
        setStructForm({ frequency: 'MONTHLY' });
        load();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to save');
        throw err;
      }
    });
    if (skipped) setError('Please wait, saving...');
  };

  const deleteStructure = async (s) => {
    if (!confirmDelete(`Delete fee structure "${s.name}"?`)) return;
    try {
      await api.delete(`/admin/fees/structures/${s.id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const assignFee = async (e) => {
    e.preventDefault();
    setError('');
    const { skipped } = await run(async () => {
      try {
        if (assignScope === 'INDIVIDUAL' && assignForm.studentId) {
          await api.post('/admin/fees/assign', assignForm);
        } else {
          const payload = {
            scope: assignScope,
            feeStructureId: assignForm.feeStructureId,
            dueDate: assignForm.dueDate,
            discount: assignForm.discount,
            batchIds: assignForm.batchIds,
            studentIds: assignForm.studentIds,
          };
          if (assignScope === 'BATCH' && assignForm.batchId) {
            payload.batchIds = [assignForm.batchId];
          }
          if (assignScope === 'INDIVIDUAL' && assignForm.studentId) {
            payload.studentIds = [assignForm.studentId];
          }
          await api.post('/admin/fees/assign/bulk', payload);
        }
        setOpenAssign(false);
        setAssignForm({});
        load();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to assign');
        throw err;
      }
    });
    if (skipped) setError('Please wait...');
  };

  const reviewRequest = async (reqId, action) => {
    const installmentCount = action === 'INSTALLMENT' ? Number(prompt('Number of installments?', '3')) : undefined;
    const extensionDays = action === 'EXTEND_DUE' ? Number(prompt('Extend by how many days?', '7')) : undefined;
    await api.post(`/admin/fees/requests/${reqId}/review`, { action, installmentCount, extensionDays });
    load();
  };

  const collect = async (id) => {
    const { skipped } = await run(async () => {
      await api.post(`/admin/fees/${id}/collect`);
      load();
    });
    if (skipped) return;
  };

  const deleteFee = async (f) => {
    if (!confirmDelete('Delete this pending fee record?')) return;
    try {
      await api.delete(`/admin/fees/${f.id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <PageTitle title="Fees & Finance" />
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={openAddStruct}>+ Fee Structure</Button>
          <Button onClick={() => { setOpenAssign(true); setError(''); }}>Assign Fee</Button>
        </div>
      </div>
      {error && !openStruct && !openAssign && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="mb-4 flex gap-2 border-b border-gray-200">
        <button type="button" onClick={() => setTab('fees')} className={`px-4 py-2 text-sm ${tab === 'fees' ? 'border-b-2 border-blue-600 font-medium text-blue-600' : 'text-gray-500'}`}>Fee Records</button>
        <button type="button" onClick={() => setTab('requests')} className={`px-4 py-2 text-sm ${tab === 'requests' ? 'border-b-2 border-blue-600 font-medium text-blue-600' : 'text-gray-500'}`}>Fee Requests ({feeRequests.filter((r) => r.status === 'PENDING').length})</button>
      </div>

      {tab === 'requests' ? (
        <div className="space-y-3">
          {feeRequests.length === 0 ? <p className="text-gray-500">No fee requests.</p> : feeRequests.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-medium">{r.student?.firstName} {r.student?.lastName} — {r.requestType}</p>
                  <p className="text-sm text-gray-600">{r.reason}</p>
                  {r.fee && <p className="text-xs text-gray-500">Fee: {r.fee.feeStructure?.name}</p>}
                </div>
                <Badge variant={r.status === 'PENDING' ? 'warning' : r.status === 'APPROVED' ? 'success' : 'danger'}>{r.status}</Badge>
              </div>
              {r.status === 'PENDING' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" className="text-xs" onClick={() => reviewRequest(r.id, 'INSTALLMENT')}>Convert to Installments</Button>
                  <Button variant="secondary" className="text-xs" onClick={() => reviewRequest(r.id, 'EXTEND_DUE')}>Extend Due Date</Button>
                  <Button className="text-xs" onClick={() => reviewRequest(r.id, 'APPROVE')}>Approve</Button>
                  <Button variant="danger" className="text-xs" onClick={() => reviewRequest(r.id, 'REJECT')}>Reject</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
      <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {structures.map((s) => (
          <div key={s.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-lg font-semibold text-primary-700">Rs. {Number(s.amount).toLocaleString()}</p>
                <p className="text-xs text-gray-500">{s.frequency}</p>
              </div>
              <RowActions onEdit={() => openEditStruct(s)} onDelete={() => deleteStructure(s)} />
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-4 py-3 text-left">Fee</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Due</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fees.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No fee records</td></tr>
            ) : fees.map((f) => (
              <tr key={f.id}>
                <td className="px-4 py-3">{f.student?.firstName} {f.student?.lastName} ({f.student?.rollNumber})</td>
                <td className="px-4 py-3">{f.feeStructure?.name}</td>
                <td className="px-4 py-3">Rs. {Number(f.amount).toLocaleString()}</td>
                <td className="px-4 py-3">{f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3"><Badge variant={f.status === 'PAID' ? 'success' : 'warning'}>{f.status}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {f.status === 'PENDING' && (
                      <>
                        <Button variant="secondary" className="px-2 py-1 text-xs" disabled={submitting} onClick={() => collect(f.id)}>Collect</Button>
                        <RowActions onDelete={() => deleteFee(f)} />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}

      <Modal open={openStruct} onClose={() => setOpenStruct(false)} title={editStructId ? 'Edit Fee Structure' : 'Fee Structure'}>
        <form onSubmit={saveStructure} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Input label="Name" value={structForm.name || ''} onChange={(e) => setStructForm({ ...structForm, name: e.target.value })} required />
          <Input label="Amount (PKR)" type="number" value={structForm.amount ?? ''} onChange={(e) => setStructForm({ ...structForm, amount: Number(e.target.value) })} required />
          <Select label="Frequency" value={structForm.frequency} onChange={(e) => setStructForm({ ...structForm, frequency: e.target.value })}>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="ANNUAL">Annual</option>
          </Select>
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : editStructId ? 'Update' : 'Save'}</Button>
        </form>
      </Modal>

      <Modal open={openAssign} onClose={() => setOpenAssign(false)} title="Assign Fee">
        <form onSubmit={assignFee} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            {['ALL_STUDENTS', 'BATCH', 'INDIVIDUAL'].map((s) => (
              <button key={s} type="button" onClick={() => setAssignScope(s)}
                className={`rounded-lg px-3 py-1.5 text-xs ${assignScope === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {s === 'ALL_STUDENTS' ? 'All Students' : s === 'BATCH' ? 'Batches' : 'Individual'}
              </button>
            ))}
          </div>
          <Select label="Fee Structure" value={assignForm.feeStructureId || ''} onChange={(e) => setAssignForm({ ...assignForm, feeStructureId: e.target.value })} required>
            <option value="">Select structure</option>
            {structures.map((s) => <option key={s.id} value={s.id}>{s.name} — Rs.{s.amount}</option>)}
          </Select>
          {assignScope === 'BATCH' && (
            <Select label="Batch / Class" value={assignForm.batchId || ''} onChange={(e) => setAssignForm({ ...assignForm, batchId: e.target.value })} required>
              <option value="">Select batch</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          )}
          {assignScope === 'INDIVIDUAL' && (
            <Select label="Student" value={assignForm.studentId || ''} onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })} required>
              <option value="">Select student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.rollNumber} — {s.firstName} {s.lastName}</option>)}
            </Select>
          )}
          <Input label="Due Date" type="date" value={assignForm.dueDate || ''} onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })} />
          <Button type="submit" disabled={submitting}>{submitting ? 'Assigning...' : 'Assign Fee'}</Button>
        </form>
      </Modal>
    </>
  );
}
