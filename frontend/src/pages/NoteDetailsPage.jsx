import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { isLoggedIn } from '../lib/auth';

export default function NoteDetailsPage() {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/api/notes/${id}`);
        setNote(res.data.note);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load note');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const previewUrl = useMemo(() => {
    if (!note?.filePath) return null;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${base}/uploads/${note.filePath}`;
  }, [note]);

  async function download() {
    const res = await api.get(`/api/notes/${id}/download`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });

    const disposition = res.headers['content-disposition'] || '';
    const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
    const fileName = decodeURIComponent(match?.[1] || match?.[2] || 'note');

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  if (loading) return <div>Loading…</div>;
  if (error) return <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>;
  if (!note) return null;

  const mime = note.mimeType || '';

  return (
    <div className="space-y-4">
      <div className="rounded border bg-white p-4">
        <div className="text-xl font-semibold">{note.title}</div>
        <div className="mt-1 text-sm text-slate-600">{note.subject} • {note.semester}</div>
        {note.description ? <div className="mt-2 text-sm">{note.description}</div> : null}
        <div className="mt-3">
          {isLoggedIn() ? (
            <button onClick={download} className="rounded bg-slate-900 px-4 py-2 text-white">Download</button>
          ) : (
            <div className="text-sm text-slate-600">Login required for download tracking.</div>
          )}
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <div className="text-sm font-medium">Preview</div>
        {!previewUrl ? (
          <div className="mt-2 text-sm text-slate-600">No preview available.</div>
        ) : mime.includes('pdf') ? (
          <iframe title="pdf" src={previewUrl} className="mt-2 h-[70vh] w-full rounded border" />
        ) : mime.startsWith('image/') ? (
          <img alt="preview" src={previewUrl} className="mt-2 max-h-[70vh] w-full rounded border object-contain" />
        ) : (
          <div className="mt-2 text-sm text-slate-600">
            Preview not supported for this file type ({mime}). Use Download.
          </div>
        )}
      </div>
    </div>
  );
}
