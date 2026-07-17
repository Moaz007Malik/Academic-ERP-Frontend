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
const MODULE_ICONS = { ACADEMIC: '🎓', DEGREE: '📘', INDIVIDUAL_COURSE: '📗' };

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
        <ListRow key={st.id} title={`${st.firstName} ${st.lastName}`} subtitle={`${st.rollNumber} · Due: ${st.dueAmount?.toLocaleString()} PKR`} due={st.dueAmount} onClick={() => drill('student', st.id, `${st.firstName} ${st.lastName}`)} />
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
        <ListRow key={ds.id} title={`${ds.student.firstName} ${ds.student.lastName}`} subtitle={`Due: ${ds.dueAmount?.toLocaleString()} PKR`} due={ds.dueAmount} onClick={() => drill('student', ds.id, `${ds.student.firstName} ${ds.student.lastName}`)} />
      ));
    }

    if (module === 'INDIVIDUAL_COURSE') {
      if (step === 1) return items.map((c) => (
        <ListRow key={c.id} title={c.name} subtitle={`${c._count?.enrollments ?? 0} students · ${c.paymentType === 'MONTHLY' ? 'Monthly' : 'One-Time'}`} onClick={() => drill('course', c.id, c.name)} />
      ));
      if (step === 2) return items.map((e) => (
        <ListRow key={e.id} title={`${e.student.firstName} ${e.student.lastName}`} subtitle={`Due: ${e.dueAmount?.toLocaleString()} PKR`} due={e.dueAmount} onClick={() => drill('enrollment', e.id, `${e.student.firstName} ${e.student.lastName}`)} />
      ));
    }
    return null;
  };

  const pendingCount = feeRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <PageTitle title="Fees & Finance" subtitle="Module → Program → Batch → Students → Fee Details" />
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" className="shadow-sm" onClick={() => { setOpenStruct(true); setEditStructId(null); setStructForm({ frequency: 'MONTHLY' }); }}>+ Fee Structure</Button>
        </div>
      </div>

      <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
        {['hub', 'structures', 'requests'].map((t) => (
          <button key={t} type="button" onClick={() => { setAdminTab(t); if (t === 'hub') resetHub(); }}
            className={`relative flex-1 rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${adminTab === t ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
            {t === 'hub' ? 'Finance Hub' : t === 'requests' ? 'Requests' : 'Structures'}
            {t === 'requests' && pendingCount > 0 && (
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${adminTab === t ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'}`}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {adminTab === 'requests' && (
        <div className="space-y-3">
          {feeRequests.length === 0 && <EmptyState title="No fee requests" message="Student and parent requests will appear here." />}
          {feeRequests.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-gray-900">{r.student?.firstName} {r.student?.lastName} <span className="text-gray-400">— {r.requestType}</span></p>
                <Badge variant={r.status === 'PENDING' ? 'warning' : r.status === 'APPROVED' ? 'success' : 'default'}>{r.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-gray-600">{r.reason}</p>
              {r.status === 'PENDING' && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
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
            <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-gray-900">{s.name}</p>
                  <p className="mt-1 text-xl font-semibold text-primary-700">Rs. {Number(s.amount).toLocaleString()}</p>
                  <Badge variant="default" className="mt-2">{s.frequency}</Badge>
                </div>
                <RowActions onEdit={() => { setEditStructId(s.id); setStructForm({ name: s.name, amount: Number(s.amount), frequency: s.frequency }); setOpenStruct(true); }} />
              </div>
            </div>
          ))}
          {!structures.length && <EmptyState title="No fee structures" message="Create one to get started." />}
        </div>
      )}

      {adminTab === 'hub' && (
        <div className="space-y-5">
          {!module ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {modules.map((m) => (
                <button key={m.key} type="button" onClick={() => selectModule(m.key)}
                  className="group rounded-2xl border-2 border-gray-200 bg-white p-6 text-left transition hover:-translate-y-0.5 hover:border-primary-400 hover:shadow-lg">
                  <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-xl group-hover:bg-primary-100">
                    {MODULE_ICONS[m.key] || '💰'}
                  </span>
                  <p className="text-lg font-semibold text-gray-900">{m.label}</p>
                  <p className="mt-1 text-sm text-gray-500">Manage {m.label.toLowerCase()} fees</p>
                </button>
              ))}
              {!modules.length && <p className="text-gray-500">No finance modules enabled.</p>}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm">
                <button type="button" className="font-medium text-primary-600 hover:underline" onClick={resetHub}>Modules</button>
                {breadcrumbs.map((b, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <span className="text-gray-300">/</span>
                    {b.action ? <button type="button" className="font-medium text-primary-600 hover:underline" onClick={b.action}>{b.label}</button> : <span className="text-gray-700">{b.label}</span>}
                  </span>
                ))}
              </div>

              {hubError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{hubError}</p>}
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
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <Input label="Name" value={structForm.name || ''} onChange={(e) => setStructForm({ ...structForm, name: e.target.value })} required />
          <Input label="Amount (PKR)" type="number" value={structForm.amount ?? ''} onChange={(e) => setStructForm({ ...structForm, amount: Number(e.target.value) })} required />
          <Select label="Frequency" value={structForm.frequency} onChange={(e) => setStructForm({ ...structForm, frequency: e.target.value })}>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="ANNUAL">Annual</option>
            <option value="ONE_TIME">One Time</option>
            <option value="SEMESTER">Semester</option>
          </Select>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">Save</Button>
        </form>
      </Modal>
    </>
  );
}

function ListRow({ title, subtitle, onClick, due }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-left transition hover:border-primary-300 hover:bg-primary-50/40 hover:shadow-sm">
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {due != null && Number(due) > 0 && <Badge variant="warning">Due</Badge>}
        {due != null && Number(due) === 0 && <Badge variant="success">Clear</Badge>}
        <span className="text-gray-300">→</span>
      </div>
    </button>
  );
}

function FeeDetailPanel({ module, data, onCollect, submitting }) {
  if (!data) return <p className="text-gray-500">Loading fee details...</p>;

  const summary = data.summary || data.feeSummary;
  const fees = data.fees || [];
  const student = data.student || data.degreeStudent?.student || data.enrollment?.student;

  return (
    <div className="space-y-5">
      <SectionCard title={student ? `${student.firstName} ${student.lastName} — Fee Details` : 'Fee Details'}>
        <StatGrid cols={3}>
          <StatCard label="Paid" value={summary?.paid?.toLocaleString()} suffix=" PKR" variant="success" />
          <StatCard label="Due" value={summary?.remaining?.toLocaleString()} suffix=" PKR" variant="warning" />
          <StatCard label="Total" value={summary?.total?.toLocaleString()} suffix=" PKR" />
        </StatGrid>

        {module === 'DEGREE' && data.degreeStudent && (
          <div className="mt-4 grid gap-2 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2">
            <p>Assigned Semester Fee: <strong>{Number(data.assignedSemesterFee).toLocaleString()} PKR</strong></p>
            <p>Discount: {Number(data.discount).toLocaleString()} PKR</p>
            <p>Scholarship: {Number(data.scholarship || 0).toLocaleString()} PKR</p>
            <p>Net Fee: {Number(data.netSemesterFee).toLocaleString()} PKR</p>
            {data.installmentEnabled && <p>Installment Plan: {data.installmentCount} installments</p>}
          </div>
        )}

        {module === 'INDIVIDUAL_COURSE' && data.enrollment && (
          <div className="mt-4 space-y-1 rounded-xl bg-gray-50 p-4 text-sm">
            <p>Course: <strong>{data.enrollment.course?.name}</strong>
              {data.enrollment.course?.paymentType && (
                <Badge className="ml-2">{data.enrollment.course.paymentType === 'MONTHLY' ? 'Monthly' : 'One-Time'}</Badge>
              )}
            </p>
            <p>Assigned Course Fee (payable): <strong>{Number(data.assignedCourseFee).toLocaleString()} PKR</strong></p>
          </div>
        )}

        {module === 'ACADEMIC' && data.student && (
          <div className="mt-4 grid gap-1 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2">
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
            <div key={plan.parentFee.id} className="mb-4 rounded-xl border border-gray-200 p-4 last:mb-0">
              <p className="font-medium text-gray-900">{plan.parentFee.feeStructure?.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Paid: {plan.paidInstallments} · Remaining: {plan.remainingInstallments} · Balance: {plan.remainingBalance?.toLocaleString()} PKR
              </p>
              <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-2">#</th><th className="px-3 py-2">Payable</th><th className="px-3 py-2">Due</th><th className="px-3 py-2">Status</th><th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {plan.installments.map((inst) => {
                      const payable = Math.max(0, Number(inst.amount || 0) + Number(inst.fine || 0) - Number(inst.discount || 0));
                      return (
                        <tr key={inst.id} className="hover:bg-gray-50/70">
                          <td className="px-3 py-2">{inst.installmentNo}</td>
                          <td className="px-3 py-2 font-medium">{payable.toLocaleString()} PKR</td>
                          <td className="px-3 py-2">{inst.dueDate ? new Date(inst.dueDate).toLocaleDateString() : '—'}</td>
                          <td className="px-3 py-2"><Badge variant={inst.status === 'PAID' ? 'success' : 'warning'}>{inst.status}</Badge></td>
                          <td className="px-3 py-2">{inst.status === 'PENDING' && <Button className="px-2 py-1 text-xs" disabled={submitting} onClick={() => onCollect(inst.id)}>Collect</Button>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      <SectionCard title="Fee Records & Payment History">
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2.5">Fee</th>
                <th className="px-3 py-2.5">Original</th>
                <th className="px-3 py-2.5">Discount</th>
                <th className="px-3 py-2.5">Payable</th>
                <th className="px-3 py-2.5">Due</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fees.map((f) => {
                const original = Number(f.amount || 0);
                const discount = Number(f.discount || 0);
                const payable = Math.max(0, original + Number(f.fine || 0) - discount);
                return (
                  <tr key={f.id} className="hover:bg-gray-50/70">
                    <td className="px-3 py-2.5">{f.feeStructure?.name}{f.installmentNo ? ` (#${f.installmentNo})` : ''}</td>
                    <td className="px-3 py-2.5">{original.toLocaleString()} PKR</td>
                    <td className="px-3 py-2.5">{discount > 0 ? `${discount.toLocaleString()} PKR` : '—'}</td>
                    <td className="px-3 py-2.5 font-medium">{payable.toLocaleString()} PKR</td>
                    <td className="px-3 py-2.5">{f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '—'}</td>
                    <td className="px-3 py-2.5"><Badge variant={f.status === 'PAID' ? 'success' : 'warning'}>{f.status}</Badge></td>
                    <td className="px-3 py-2.5">{f.status === 'PENDING' && !f.parentFeeId && <Button className="px-2 py-1 text-xs" disabled={submitting} onClick={() => onCollect(f.id)}>Collect</Button>}</td>
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