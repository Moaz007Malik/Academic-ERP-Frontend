import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';

export default function IdCardPage() {
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [preview, setPreview] = useState(null);
  const [designUrl, setDesignUrl] = useState('');

  useEffect(() => {
    api.get('/admin/students?limit=500').then((res) => setStudents(res.data.data || []));
    api.get('/admin/idcard').then((res) => {
      const designs = res.data.data || [];
      if (designs[0]) setDesignUrl(designs[0].fileUrl);
    });
  }, []);

  const loadPreview = async () => {
    if (!selectedId) return;
    const res = await api.get(`/admin/idcard/preview/${selectedId}`);
    setPreview(res.data.data);
  };

  const saveDesign = async () => {
    if (!designUrl) return;
    await api.post('/admin/idcard', { fileUrl: designUrl, type: 'STUDENT_ID' });
    alert('Card design saved.');
  };

  const printCard = () => window.print();

  return (
    <>
      <PageTitle title="Student ID Card" subtitle="Design, preview, and print student ID cards" />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          <Input label="Background / Template URL" value={designUrl} onChange={(e) => setDesignUrl(e.target.value)} />
          <Button onClick={saveDesign}>Save Design</Button>
          <Select label="Select Student" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Choose student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.rollNumber} — {s.firstName} {s.lastName}</option>
            ))}
          </Select>
          <Button onClick={loadPreview}>Load Preview</Button>
        </div>

        {preview && (
          <div id="id-card-print" className="rounded-xl border-2 border-gray-300 bg-white p-6 shadow-lg print:shadow-none">
            <div className="flex gap-4">
              {preview.student.photo && (
                <img src={preview.student.photo} alt="" className="h-24 w-24 rounded object-cover border" />
              )}
              <div>
                <p className="text-xs text-gray-500">{preview.institute.name}</p>
                <h3 className="text-lg font-bold">{preview.student.firstName} {preview.student.lastName}</h3>
                <p className="text-sm">Roll: {preview.student.rollNumber}</p>
                <p className="text-sm text-gray-600">{preview.student.batch} · {preview.student.section}</p>
              </div>
            </div>
            <div className="mt-4 rounded bg-gray-100 p-2 text-center text-xs font-mono break-all">
              QR: {preview.qrData}
            </div>
            <div className="mt-4 flex gap-2 print:hidden">
              <Button onClick={printCard}>Print</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
