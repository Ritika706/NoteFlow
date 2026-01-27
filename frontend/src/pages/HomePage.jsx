import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function HomePage() {
  const [notes, setNotes] = useState([]);
  const [q, setQ] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/notes', { params: { q, subject, semester } });
      setNotes(res.data.notes || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subjects = useMemo(() => {
    const s = new Set(notes.map((n) => n.subject).filter(Boolean));
    return Array.from(s);
  }, [notes]);

  const semesters = useMemo(() => {
    const s = new Set(notes.map((n) => n.semester).filter(Boolean));
    return Array.from(s);
  }, [notes]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded border bg-white p-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="text-sm font-medium">Search</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="Title / subject / semester"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Subject</label>
          <select className="mt-1 w-full rounded border px-3 py-2" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">All</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Semester</label>
          <select className="mt-1 w-full rounded border px-3 py-2" value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="">All</option>
            {semesters.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button onClick={load} className="rounded bg-slate-900 px-4 py-2 text-white">Apply</button>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          {notes.map((n) => (
            <div key={n._id} className="rounded border bg-white p-4">
              <div className="text-base font-semibold">{n.title}</div>
              <div className="mt-1 text-sm text-slate-600">{n.subject} • {n.semester}</div>
              {n.description ? <div className="mt-2 text-sm">{n.description}</div> : null}
              <div className="mt-3 flex items-center gap-3">
                <Link className="text-sm font-medium text-blue-600" to={`/notes/${n._id}`}>Open</Link>
              </div>
            </div>
          ))}
          {notes.length === 0 && <div className="text-sm text-slate-600">No notes found.</div>}
        </div>
      )}
    </div>
  );
}
