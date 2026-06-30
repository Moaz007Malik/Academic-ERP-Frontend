import { useEffect, useState } from 'react';
import api from '../../services/api';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { RowActions, confirmDelete } from '../common/RowActions';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const CATEGORIES = [
  { value: 'CNIC', label: 'CNIC' },
  { value: 'B_FORM', label: 'B-Form' },
  { value: 'DEGREE', label: 'Degree' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'TRANSCRIPT', label: 'Transcript' },
  { value: 'APPOINTMENT_LETTER', label: 'Appointment Letter' },
  { value: 'EXPERIENCE_LETTER', label: 'Experience Letter' },
  { value: 'PHOTO_ID', label: 'Photo ID' },
  { value: 'OTHER', label: 'Other' },
];

/**
 * @param {object} props
 * @param {'student'|'teacher'} props.personType
 * @param {string} [props.personId] - required for admin API
 * @param {'admin'|'portal'} [props.mode]
 */
export default function DocumentManager({ personType, personId, mode = 'admin' }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ category: 'OTHER', title: '' });
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const { submitting, run } = useAsyncSubmit();

  const listUrl = mode === 'admin'
    ? `/admin/documents/${personType}s/${personId}`
    : `/${personType}/documents`;

  const load = () => {
    if (mode === 'admin' && !personId) return;
    setLoading(true);
    api.get(listUrl)
      .then((res) => setDocuments(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load documents'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [personId, personType, mode]);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }
    setError('');
    const { skipped } = await run(async () => {
      try {
        const data = new FormData();
        data.append('file', file);
        data.append('category', form.category);
        if (form.title) data.append('title', form.title);

        const postUrl = mode === 'admin'
          ? `/admin/documents/${personType}s/${personId}`
          : `/${personType}/documents`;

        await api.post(postUrl, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        setFile(null);
        setFileKey((k) => k + 1);
        setForm({ category: 'OTHER', title: '' });
        load();
      } catch (err) {
        setError(err.response?.data?.message || 'Upload failed');
        throw err;
      }
    });
    if (skipped) setError('Please wait, uploading...');
  };

  const remove = async (doc) => {
    if (!confirmDelete(`Delete "${doc.title}"?`)) return;
    const deleteUrl = mode === 'admin'
      ? `/admin/documents/${personType}s/${personId}/${doc.id}`
      : `/${personType}/documents/${doc.id}`;
    try {
      await api.delete(deleteUrl);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <form onSubmit={upload} className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">Upload document (PDF, Word, or image — max 10MB)</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Matric Certificate" />
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </div>
        <input
          key={fileKey}
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-700"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={submitting}>{submitting ? 'Uploading...' : 'Upload'}</Button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Loading documents...</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-gray-500">No documents uploaded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">File</th>
                <th className="px-3 py-2 text-left">Size</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-3 py-2 font-medium">{doc.title}</td>
                  <td className="px-3 py-2">{doc.category.replace(/_/g, ' ')}</td>
                  <td className="px-3 py-2">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      {doc.fileName}
                    </a>
                  </td>
                  <td className="px-3 py-2">{formatSize(doc.fileSize)}</td>
                  <td className="px-3 py-2">{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    <RowActions onDelete={() => remove(doc)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
