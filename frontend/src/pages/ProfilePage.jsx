import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/api/me');
        setProfile(res.data);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading…</div>;
  if (error) return <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>;
  if (!profile) return null;

  const { user, uploads, downloads } = profile;

  return (
    <div className="space-y-4">
      <div className="rounded border bg-white p-4">
        <div className="text-lg font-semibold">Profile</div>
        <div className="mt-2 text-sm text-slate-700">
          <div><span className="font-medium">Name:</span> {user.name}</div>
          <div><span className="font-medium">Email:</span> {user.email}</div>
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <div className="text-base font-semibold">My Uploads</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(uploads || []).map((n) => (
            <div key={n._id} className="rounded border p-3">
              <div className="font-medium">{n.title}</div>
              <div className="text-sm text-slate-600">{n.subject} • {n.semester}</div>
              <div className="mt-2 text-sm"><Link className="text-blue-600" to={`/notes/${n._id}`}>Open</Link></div>
            </div>
          ))}
          {(uploads || []).length === 0 && <div className="text-sm text-slate-600">No uploads yet.</div>}
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <div className="text-base font-semibold">My Downloads</div>
        <div className="mt-3 space-y-2">
          {(downloads || []).map((d, idx) => (
            <div key={idx} className="rounded border p-3">
              <div className="font-medium">{d.note?.title || 'Unknown note'}</div>
              <div className="text-sm text-slate-600">
                {d.note?.subject || ''} {d.note?.semester ? `• ${d.note.semester}` : ''}
              </div>
              <div className="mt-1 text-xs text-slate-500">Downloaded at: {new Date(d.downloadedAt).toLocaleString()}</div>
            </div>
          ))}
          {(downloads || []).length === 0 && <div className="text-sm text-slate-600">No downloads yet.</div>}
        </div>
      </div>
    </div>
  );
}
