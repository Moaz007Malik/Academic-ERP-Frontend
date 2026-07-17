import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { SectionCard, StatGrid, StatCard, EmptyState } from '../../components/layout/DetailPageLayout';
import { RowActions, confirmDelete } from '../../components/common/RowActions';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const MODULE_LABELS = { ACADEMIC: 'Academic', DEGREE: 'Degree', INDIVIDUAL_COURSE: 'Individual Course' };

export default function FeesPage() {
  const [modules, setModules] = useState([]);
  const [module, setModule] = useState(null);
  const [step, setStep] = useState(0);
  const [selection, setSelection] = useState({});
  const [items, setItems] = useState([]);
  const [feeDetail, setFeeDetail] = useState(null);
  const [structures, setStructures] = useState([]);
  const [feeRequests, setFeeRequests] = useState([]);
  const [adminTab, setAdminTab] = useState('hub');
  const [openStruct, setOpenStruct] = useState(false);
  const [editStructId, setEditStructId] = useState(null);
  const [structForm, setStructForm] = useState({ frequency: 'MONTHLY' });
  const [error, setError] = useState('');
  const { submitting, run } = useAsyncSubmit();

  const loadAdmin = () => {
    Promise.all([
      api.get('/admin/fees/structures'),
      api.get('/admin/fees/requests'),
      api.get('/admin/finance/modules'),
    ]).then(([sRes, rRes, mRes]) => {
      setStructures(sRes.data.data || []);
      setFeeRequests(rRes.data.data || []);
      setModules(mRes.data.data || []);
    });
  };

  useEffect(() => { loadAdmin(); }, []);

  const resetHub = () => {
    setModule(null);
    setStep(0);
    setSelection({});
    setItems([]);
    setFeeDetail(null);
  };

  const selectModule = (m) => {
    setModule(m);
    setStep(1);
    setSelection({});
    setItems([]);
    setFeeDetail(null);
    if (m === 'ACADEMIC') {
      api.get('/admin/finance/academic/sessions').then((res) => setItems(res.data.data || []));
    } else if (m === 'DEGREE') {
      api.get('/admin/finance/degree/programs').then((res) => setItems(res.data.data || []));
    } else {
      api.get('/admin/finance/individual-courses/courses').then((res) => setItems(res.data.data || []));
    }
  };

  const [hubLoading, setHubLoading] = useState(false);
  const [hubError, setHubError] = useState('');

  const drill = async (key, value, label, meta = {}) => {
    const next = { ...selection, [key]: { value, label, ...meta } };
    setSelection(next);
    setFeeDetail(null);
    setHubError('');
    setHubLoading(true);
    try {
      if (module === 'ACADEMIC') {
        if (key === 'session') {
          setStep(2);
          const res = await api.get('/admin/finance/academic/batches', { params: { sessionId: value } });
          setItems(res.data.data || []);
        } else if (key === 'batch') {
          setStep(3);
          const res = await api.get('/admin/finance/academic/sections', { params: { batchId: value } });
          setItems(res.data.data || []);
        } else if (key === 'section') {
          setStep(4);
          const res = await api.get('/admin/finance/academic/students', { params: { sectionId: value } });
          setItems(res.data.data || []);
        } else if (key === 'student') {
          setStep(5);
          const res = await api.get(`/admin/finance/academic/students/${value}/fees`);
          setFeeDetail(res.data.data);
        }
      } else if (module === 'DEGREE') {
        if (key === 'degree') {
          setStep(2);
          const res = await api.get('/admin/finance/degree/batches', { params: { degreeId: value } });
          setItems(res.data.data || []);
        } else if (key === 'batch') {
          setStep(3);
          const res = await api.get('/admin/finance/degree/semesters', { params: { batchId: value } });
          setItems(res.data.data || []);
        } else if (key === 'semester') {
          setStep(4);
          const res = await api.get('/admin/finance/degree/students', {
            params: { batchId: next.batch.value, semesterNumber: next.semester.number },
          });
          setItems(res.data.data || []);
        } else if (key === 'student') {
          setStep(5);
          const res = await api.get(`/admin/finance/degree/students/${value}/fees`);
          setFeeDetail(res.data.data);
        }
      } else if (module === 'INDIVIDUAL_COURSE') {
        if (key === 'course') {
          setStep(2);
          const res = await api.get('/admin/finance/individual-courses/students', { params: { courseId: value } });
          setItems(res.data.data || []);
        } else if (key === 'enrollment') {
          setStep(3);
          const res = await api.get(`/admin/finance/individual-courses/enrollments/${value}/fees`);
          setFeeDetail(res.data.data);
        }
      }
    } catch (err) {
      setHubError(err.response?.data?.message || 'Failed to load fee data');
      setItems([]);
    } finally {
      setHubLoading(false);
    }
  };

  const breadcrumbs = [
    module && { label: MODULE_LABELS[module], action: () => selectModule(module) },
    selection.session && { label: selection.session.label },
    selection.degree && { label: selection.degree.label },
    selection.batch && { label: selection.batch.label },
    selection.section && { label: `Section ${selection.section.label}` },
    selection.semester && { label: selection.semester.label },
    selection.course && {
      label: selection.course.label,
      action: module === 'INDIVIDUAL_COURSE' && feeDetail
        ? () => drill('course', selection.course.value, selection.course.label)
        : undefined,
    },
    selection.student && { label: selection.student.label },
    selection.enrollment && { label: selection.enrollment.label },
  ].filter(Boolean);

  const collect = async (id) => {
    await api.post(`/admin/fees/${id}/collect`);
    if (module === 'ACADEMIC' && selection.student) drill('student', selection.student.value, selection.student.label);
    else if (module === 'DEGREE' && selection.student) drill('student', selection.student.value, selection.student.label);
    else if (module === 'INDIVIDUAL_COURSE' && selection.enrollment) drill('enrollment', selection.enrollment.value, selection.enrollment.label);
  };

  const reviewRequest = async (reqId, action) => {
    const installmentCount = action === 'INSTALLMENT' ? Number(prompt('Number of installments?', '3')) : undefined;
    const extensionDays = action === 'EXTEND_DUE' ? Number(prompt('Extend by how many days?', '7')) : undefined;
    await api.post(`/admin/fees/requests/${reqId}/review`, { action, installmentCount, extensionDays });
    loadAdmin();
  };

  const saveStructure = async (e) => {
    e.preventDefault();
    await run(async () => {
      if (editStructId) await api.put(`/admin/fees/structures/${editStructId}`, structForm);
      else await api.post('/admin/fees/structures', structForm);
      setOpenStruct(false);
      loadAdmin();
    });
  };

  const renderList = () => {
    if (!items.length) return <EmptyState title="No records at this level" />;

    if (module === 'ACADEMIC') {
      if (step === 1) return items.map((s) => (
        <ListRow key={s.id} title={s.name} subtitle={s.isActive ? 'Active session' : ''} onClick={() => drill('session', s.id, s.name)} />
      ));
      if (step === 2) return items.map((b) => (
        <ListRow key={b.id} title={b.name} subtitle={`${b._count?.students ?? 0} students`} onClick={() => drill('batch', b.id, b.name)} />
      ));
      if (step === 3) return items.map((sec) => (
        <ListRow key={sec.id} title={`Section ${sec.name}`} subtitle={`${sec._count?.students ?? 0} students`} onClick={() => drill('section', sec.id, sec.name)} />
      ));
      if (step === 4) return items.map((st) => (
        <ListRow key={st.id} title={`${st.firstName} ${st.lastName}`} subtitle={`${st.rollNumber} · Due: ${st.dueAmount?.toLocaleString()} PKR`} onClick={() => drill('student', st.id, `${st.firstName} ${st.lastName}`)} />
      ));
    }

    if (module === 'DEGREE') {
      if (step === 1) return items.map((d) => (
        <ListRow key={d.id} title={d.name} subtitle={`${d._count?.batches ?? 0} batches`} onClick={() => drill('degree', d.id, d.name)} />
      ));
      if (step === 2) return items.map((b) => (
        <ListRow key={b.id} title={b.name} subtitle={`Semester ${b.currentSemester}/${b.totalSemesters}`} onClick={() => drill('batch', b.id, b.name)} />
      ));
      if (step === 3) return items.map((s) => (
        <ListRow key={s.id} title={s.name} subtitle={`Fee: ${Number(s.effectiveFee).toLocaleString()} PKR`} onClick={() => drill('semester', s.id, s.name, { number: s.number })} />
      ));
      if (step === 4) return items.map((ds) => (
        <ListRow key={ds.id} title={`${ds.student.firstName} ${ds.student.lastName}`} subtitle={`Due: ${ds.dueAmount?.toLocaleString()} PKR`} onClick={() => drill('student', ds.id, `${ds.student.firstName} ${ds.student.lastName}`)} />
      ));
    }

    if (module === 'INDIVIDUAL_COURSE') {
      if (step === 1) return items.map((c) => (
        <ListRow key={c.id} title={c.name} subtitle={`${c._count?.enrollments ?? 0} students · ${c.paymentType === 'MONTHLY' ? 'Monthly' : 'One-Time'}`} onClick={() => drill('course', c.id, c.name)} />
      ));
      if (step === 2) return items.map((e) => (
        <ListRow key={e.id} title={`${e.student.firstName} ${e.student.lastName}`} subtitle={`Due: ${e.dueAmount?.toLocaleString()} PKR`} onClick={() => drill('enrollment', e.id, `${e.student.firstName} ${e.student.lastName}`)} />
      ));
    }
    return null;
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <PageTitle title="Fees & Finance" subtitle="Module → Program → Batch → Students → Fee Details" />
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={() => { setOpenStruct(true); setEditStructId(null); setStructForm({ frequency: 'MONTHLY' }); }}>+ Fee Structure</Button>
        </div>
      </div>

      <div className="mb-4 flex gap-2 border-b border-gray-200">
        {['hub', 'structures', 'requests'].map((t) => (
          <button key={t} type="button" onClick={() => { setAdminTab(t); if (t === 'hub') resetHub(); }}
            className={`px-4 py-2 text-sm capitalize ${adminTab === t ? 'border-b-2 border-blue-600 font-medium text-blue-600' : 'text-gray-500'}`}>
            {t === 'hub' ? 'Finance Hub' : t === 'requests' ? `Requests (${feeRequests.filter((r) => r.status === 'PENDING').length})` : 'Structures'}
          </button>
        ))}
      </div>

      {adminTab === 'requests' && (
        <div className="space-y-3">
          {feeRequests.map((r) => (
            <div key={r.id} className="rounded-xl border bg-white p-4">
              <div className="flex justify-between"><p className="font-medium">{r.student?.firstName} {r.student?.lastName} — {r.requestType}</p><Badge>{r.status}</Badge></div>
              <p className="text-sm text-gray-600">{r.reason}</p>
              {r.status === 'PENDING' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" className="text-xs" onClick={() => reviewRequest(r.id, 'INSTALLMENT')}>Installments</Button>
                  <Button variant="secondary" className="text-xs" onClick={() => reviewRequest(r.id, 'EXTEND_DUE')}>Extend Due</Button>
                  <Button className="text-xs" onClick={() => reviewRequest(r.id, 'APPROVE')}>Approve</Button>
                  <Button variant="danger" className="text-xs" onClick={() => reviewRequest(r.id, 'REJECT')}>Reject</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {adminTab === 'structures' && (
        <div className="grid gap-4 sm:grid-cols-3">
          {structures.map((s) => (
            <div key={s.id} className="rounded-lg border bg-white p-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-lg font-semibold text-primary-700">Rs. {Number(s.amount).toLocaleString()}</p>
                </div>
                <RowActions onEdit={() => { setEditStructId(s.id); setStructForm({ name: s.name, amount: Number(s.amount), frequency: s.frequency }); setOpenStruct(true); }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {adminTab === 'hub' && (
        <div className="space-y-4">
          {!module ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {modules.map((m) => (
                <button key={m.key} type="button" onClick={() => selectModule(m.key)}
                  className="rounded-xl border-2 border-gray-200 bg-white p-6 text-left transition hover:border-blue-500 hover:shadow-md">
                  <p className="text-lg font-semibold">{m.label}</p>
                  <p className="mt-1 text-sm text-gray-500">Manage {m.label.toLowerCase()} fees</p>
                </button>
              ))}
              {!modules.length && <p className="text-gray-500">No finance modules enabled.</p>}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <button type="button" className="text-blue-600" onClick={resetHub}>Modules</button>
                {breadcrumbs.map((b, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <span className="text-gray-400">/</span>
                    {b.action ? <button type="button" className="text-blue-600" onClick={b.action}>{b.label}</button> : <span>{b.label}</span>}
                  </span>
                ))}
              </div>

              {hubError && <p className="text-sm text-red-600">{hubError}</p>}
              {hubLoading && !feeDetail ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : feeDetail ? (
                <FeeDetailPanel module={module} data={feeDetail} onCollect={collect} submitting={submitting} />
              ) : (
                <SectionCard title={step === 1 ? `Select ${MODULE_LABELS[module]}` : 'Select next level'}>
                  <div className="space-y-2">{renderList()}</div>
                </SectionCard>
              )}
            </>
          )}
        </div>
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
            <option value="ONE_TIME">One Time</option>
            <option value="SEMESTER">Semester</option>
          </Select>
          <Button type="submit" disabled={submitting}>Save</Button>
        </form>
      </Modal>
    </>
  );
}

function ListRow({ title, subtitle, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left hover:border-blue-400">
      <div>
        <p className="font-medium">{title}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      <span className="text-gray-400">→</span>
    </button>
  );
}

function FeeDetailPanel({ module, data, onCollect, submitting }) {
  if (!data) return <p className="text-gray-500">Loading fee details...</p>;

  const summary = data.summary || data.feeSummary;
  const fees = data.fees || [];
  const student = data.student || data.degreeStudent?.student || data.enrollment?.student;

  return (
    <div className="space-y-4">
      <SectionCard title={student ? `${student.firstName} ${student.lastName} — Fee Details` : 'Fee Details'}>
        <StatGrid cols={3}>
          <StatCard label="Paid" value={summary?.paid?.toLocaleString()} suffix=" PKR" variant="success" />
          <StatCard label="Due" value={summary?.remaining?.toLocaleString()} suffix=" PKR" variant="warning" />
          <StatCard label="Total" value={summary?.total?.toLocaleString()} suffix=" PKR" />
        </StatGrid>

        {module === 'DEGREE' && data.degreeStudent && (
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <p>Assigned Semester Fee: <strong>{Number(data.assignedSemesterFee).toLocaleString()} PKR</strong></p>
            <p>Discount: {Number(data.discount).toLocaleString()} PKR</p>
            <p>Scholarship: {Number(data.scholarship || 0).toLocaleString()} PKR</p>
            <p>Net Fee: {Number(data.netSemesterFee).toLocaleString()} PKR</p>
            {data.installmentEnabled && <p>Installment Plan: {data.installmentCount} installments</p>}
          </div>
        )}

        {module === 'INDIVIDUAL_COURSE' && data.enrollment && (
          <div className="mt-4 space-y-1 text-sm">
            <p>Course: <strong>{data.enrollment.course?.name}</strong>
              {data.enrollment.course?.paymentType && (
                <Badge className="ml-2">{data.enrollment.course.paymentType === 'MONTHLY' ? 'Monthly' : 'One-Time'}</Badge>
              )}
            </p>
            <p>Assigned Course Fee (payable): <strong>{Number(data.assignedCourseFee).toLocaleString()} PKR</strong></p>
          </div>
        )}

        {module === 'ACADEMIC' && data.student && (
          <div className="mt-4 grid gap-1 text-sm sm:grid-cols-2">
            <p>Original Registration: <strong>{Number(data.student.assignedRegistrationFee || 0).toLocaleString()} PKR</strong></p>
            <p>Reg. Discount: {Number(data.student.registrationDiscount || 0).toLocaleString()} PKR</p>
            <p>Original Monthly: <strong>{Number(data.student.assignedMonthlyFee || 0).toLocaleString()} PKR</strong></p>
            <p>Monthly Discount: {Number(data.student.monthlyDiscount || 0).toLocaleString()} PKR</p>
          </div>
        )}
      </SectionCard>

      {summary?.installmentPlans?.length > 0 && (
        <SectionCard title="Installment Schedule">
          {summary.installmentPlans.map((plan) => (
            <div key={plan.parentFee.id} className="mb-4 rounded border p-3">
              <p className="font-medium">{plan.parentFee.feeStructure?.name}</p>
              <p className="text-xs text-gray-500">
                Paid: {plan.paidInstallments} · Remaining: {plan.remainingInstallments} · Balance: {plan.remainingBalance?.toLocaleString()} PKR
              </p>
              <table className="mt-2 min-w-full text-sm">
                <thead><tr className="text-left text-xs text-gray-500"><th>#</th><th>Payable</th><th>Due</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {plan.installments.map((inst) => {
                    const payable = Math.max(0, Number(inst.amount || 0) + Number(inst.fine || 0) - Number(inst.discount || 0));
                    return (
                      <tr key={inst.id} className="border-t">
                        <td className="py-1">{inst.installmentNo}</td>
                        <td>{payable.toLocaleString()} PKR</td>
                        <td>{inst.dueDate ? new Date(inst.dueDate).toLocaleDateString() : '—'}</td>
                        <td><Badge variant={inst.status === 'PAID' ? 'success' : 'warning'}>{inst.status}</Badge></td>
                        <td>{inst.status === 'PENDING' && <Button className="px-2 py-1 text-xs" disabled={submitting} onClick={() => onCollect(inst.id)}>Collect</Button>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </SectionCard>
      )}

      <SectionCard title="Fee Records & Payment History">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-gray-500">
                <th className="py-2">Fee</th>
                <th>Original</th>
                <th>Discount</th>
                <th>Payable</th>
                <th>Due</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fees.map((f) => {
                const original = Number(f.amount || 0);
                const discount = Number(f.discount || 0);
                const payable = Math.max(0, original + Number(f.fine || 0) - discount);
                return (
                  <tr key={f.id} className="border-b border-gray-100">
                    <td className="py-2">{f.feeStructure?.name}{f.installmentNo ? ` (#${f.installmentNo})` : ''}</td>
                    <td>{original.toLocaleString()} PKR</td>
                    <td>{discount > 0 ? `${discount.toLocaleString()} PKR` : '—'}</td>
                    <td className="font-medium">{payable.toLocaleString()} PKR</td>
                    <td>{f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '—'}</td>
                    <td><Badge variant={f.status === 'PAID' ? 'success' : 'warning'}>{f.status}</Badge></td>
                    <td>{f.status === 'PENDING' && !f.parentFeeId && <Button className="px-2 py-1 text-xs" disabled={submitting} onClick={() => onCollect(f.id)}>Collect</Button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!fees.length && <EmptyState title="No fee records" message="No fees assigned for this student yet." />}
      </SectionCard>
    </div>
  );
}
