import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function UploadPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a file');
      return;
    }

    const form = new FormData();
    form.append('title', title);
    form.append('subject', subject);
    form.append('semester', semester);
    form.append('description', description);
    form.append('file', file);

    setLoading(true);
    try {
      await api.post('/api/notes', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded border bg-white p-6">
      <h1 className="text-xl font-semibold">Upload Note</h1>
      <p className="mt-1 text-sm text-slate-600">PDF, images, or documents.</p>

      {error && <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="text-sm font-medium">Title</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Subject</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Semester</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={semester} onChange={(e) => setSemester(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea className="mt-1 w-full rounded border px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">File</label>
          <input type="file" className="mt-1 w-full rounded border px-3 py-2" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>

        <button disabled={loading} className="w-full rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60">
          {loading ? 'Uploading…' : 'Upload'}
        </button>
      </form>
    </div>
  );
}
