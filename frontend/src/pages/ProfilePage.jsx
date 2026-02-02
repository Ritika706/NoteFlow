import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { clearToken } from '../lib/auth';
import { toastError, toastInfo, toastSuccess } from '../lib/toast';
import { getAxiosErrorMessage } from '../lib/axiosError';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { Tabs } from '../components/Tabs';
import { NoteCard } from '../components/NoteCard';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('uploads');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/api/me');
        setProfile(res.data);
      } catch (e) {
        const status = e?.response?.status;
        const message = e?.response?.data?.message;
        if (status === 401 || status === 404) {
          clearToken();
          navigate('/login', { replace: true });
          return;
        }
        setError(message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const user = profile?.user;
  const uploads = profile?.uploads || [];
  const downloads = profile?.downloads || [];
  const bookmarks = profile?.bookmarks || [];

  const downloadNotes = useMemo(() => {
    return downloads
      .map((d) => ({
        ...(d.note || {}),
        downloadedAt: d.downloadedAt,
      }))
      .filter((n) => n._id);
  }, [downloads]);

  async function handleDownload(note) {
    try {
      const res = await api.get(`/api/notes/${note._id}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });

      const disposition = res.headers['content-disposition'] || '';
      const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
      const fileName = decodeURIComponent(match?.[1] || match?.[2] || note.originalName || 'note');

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toastSuccess('Download started!');
    } catch (e) {
      if (e?.response?.status === 401) {
        toastInfo('Please login again.');
        clearToken();
        navigate('/auth?mode=login');
        return;
      }
      const msg = await getAxiosErrorMessage(e, 'Download failed');
      toastError(msg);
    }
  }

  async function handleDeleteUpload(note) {
    const ok = window.confirm('Delete this upload? This cannot be undone.');
    if (!ok) return;

    try {
      await api.delete(`/api/notes/${note._id}`);
      toastSuccess('Upload deleted');
      setProfile((prev) => {
        if (!prev) return prev;
        const nextUploads = (prev.uploads || []).filter((n) => String(n._id) !== String(note._id));
        return { ...prev, uploads: nextUploads };
      });
    } catch (e) {
      const msg = await getAxiosErrorMessage(e, 'Failed to delete upload');
      toastError(msg);
    }
  }

  if (loading) return <div>Loading…</div>;
  if (error) return <div className="rounded-xl border border-destructive/20 bg-white/70 p-3 text-sm text-destructive">{error}</div>;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary/25 via-sky-400/15 to-accent/15 border border-white/20 dark:border-white/10 shadow-soft">
        <div className="p-8 text-center">
          <Avatar name={user?.name} className="mx-auto h-20 w-20 text-2xl border-2 border-white/50" />
          <div className="mt-3 font-display text-2xl font-bold">{user?.name}</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{user?.email}</div>
        </div>
      </section>

      <Card className="p-6">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'uploads', label: 'My Uploads' },
            { value: 'downloads', label: 'My Downloads' },
            { value: 'bookmarks', label: 'My Bookmarks' },
          ]}
        />

        {tab === 'uploads' ? (
          <div className="mt-5">
            {uploads.length === 0 ? (
              <div className="text-sm text-slate-600 dark:text-slate-300">No uploads yet.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {uploads.map((n) => (
                  <NoteCard key={n._id} note={n} onDownload={handleDownload} onDelete={handleDeleteUpload} />
                ))}
              </div>
            )}
          </div>
        ) : tab === 'downloads' ? (
          <div className="mt-5">
            {downloadNotes.length === 0 ? (
              <div className="text-sm text-slate-600 dark:text-slate-300">No downloads yet.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {downloadNotes.map((n) => (
                  <NoteCard
                    key={n._id}
                    note={{ ...n, downloadCount: n.downloadCount || 0 }}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5">
            {bookmarks.length === 0 ? (
              <div className="text-sm text-slate-600 dark:text-slate-300">No bookmarks yet.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bookmarks.map((n) => (
                  <NoteCard key={n._id} note={n} onDownload={handleDownload} />
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
