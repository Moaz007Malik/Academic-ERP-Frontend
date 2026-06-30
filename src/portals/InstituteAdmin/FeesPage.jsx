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
  const [openStruct, setOpenStruct] = useState(false);
  const [editStructId, setEditStructId] = useState(null);
  const [openAssign, setOpenAssign] = useState(false);
  const [structForm, setStructForm] = useState({ frequency: 'MONTHLY' });
  const [assignForm, setAssignForm] = useState({});
  const [error, setError] = useState('');
  const { submitting, run } = useAsyncSubmit();

  const load = () => {
    Promise.all([
      api.get('/admin/fees/structures'),
      api.get('/admin/fees'),
      api.get('/admin/students?limit=200'),
    ]).then(([sRes, fRes, stRes]) => {
      setStructures(sRes.data.data || []);
      setFees(fRes.data.data || []);
      setStudents(stRes.data.data || []);
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
        await api.post('/admin/fees/assign', assignForm);
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

      <Modal open={openAssign} onClose={() => setOpenAssign(false)} title="Assign Fee to Student">
        <form onSubmit={assignFee} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Select label="Student" value={assignForm.studentId || ''} onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })} required>
            <option value="">Select student</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.rollNumber} — {s.firstName} {s.lastName}</option>)}
          </Select>
          <Select label="Fee Structure" value={assignForm.feeStructureId || ''} onChange={(e) => setAssignForm({ ...assignForm, feeStructureId: e.target.value })} required>
            <option value="">Select structure</option>
            {structures.map((s) => <option key={s.id} value={s.id}>{s.name} — Rs.{s.amount}</option>)}
          </Select>
          <Input label="Due Date" type="date" value={assignForm.dueDate || ''} onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })} />
          <Button type="submit" disabled={submitting}>{submitting ? 'Assigning...' : 'Assign'}</Button>
        </form>
      </Modal>
    </>
  );
}
