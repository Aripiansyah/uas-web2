import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

function toMillis(ts) {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (ts instanceof Timestamp) return ts.toMillis();
  if (typeof ts?.toMillis === 'function') return ts.toMillis();
  if (typeof ts?.seconds === 'number') return ts.seconds * 1000;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function formatDate(ts) {
  const ms = toMillis(ts);
  if (!ms) return '';
  const d = new Date(ms);
  return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: '2-digit' });
}

export default function Announcement() {
  const currentUser = useMemo(
    () => JSON.parse(localStorage.getItem('currentUser')) || {},
    []
  );

  const role = currentUser.role || 'User';
  const isAdmin = role === 'Admin';

  const [announcements, setAnnouncements] = useState([]);

  // create
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  // edit
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  useEffect(() => {
    const q = collection(db, 'announcements');
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      setAnnouncements(list);
    });

    return () => unsub();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) return;

    await addDoc(collection(db, 'announcements'), {
      title: trimmedTitle,
      body: trimmedBody,
      createdAt: serverTimestamp(),
      createdBy: currentUser.uid || 'unknown'
    });

    setTitle('');
    setBody('');
  };

  const startEdit = (a) => {
    if (!isAdmin) return;
    setEditingId(a.id);
    setEditTitle(a.title || '');
    setEditBody(a.body || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditBody('');
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!isAdmin || !editingId) return;

    const trimmedTitle = editTitle.trim();
    const trimmedBody = editBody.trim();
    if (!trimmedTitle || !trimmedBody) return;

    await updateDoc(doc(db, 'announcements', editingId), {
      title: trimmedTitle,
      body: trimmedBody
    });

    cancelEdit();
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    const ok = window.confirm('Hapus pengumuman ini?');
    if (!ok) return;

    await deleteDoc(doc(db, 'announcements', id));
  };

  return (
    <div className="w-full h-full min-h-0">
      <div className="max-w-5xl mx-auto space-y-4 p-3 md:p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border border-slate-200 bg-white rounded-2xl p-4 shadow-sm">
          <div>
            <h1 className="text-base md:text-lg font-black tracking-tight text-slate-900">
              Pengumuman
            </h1>
            <p className="text-[11px] font-bold text-slate-500 mt-1">
              Info penting untuk semua mahasiswa.
            </p>
          </div>

          {isAdmin && (
            <div className="text-[10px] font-black px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 shrink-0">
              Admin Mode
            </div>
          )}
        </div>

        {/* Admin Create */}
        {isAdmin && (
          <form
            onSubmit={handleCreate}
            className="border border-slate-200 bg-white rounded-2xl p-4 shadow-sm space-y-3"
          >
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-black text-slate-700 mb-1">
                  Judul
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-0 focus:border-indigo-300"
                  placeholder="Contoh: Jadwal Ujian Akhir"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Isi Pengumuman
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full min-h-28 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-0 focus:border-indigo-300"
                placeholder="Tulis detail pengumuman..."
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!title.trim() || !body.trim()}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
              >
                Buat Pengumuman
              </button>

              <button
                type="button"
                onClick={() => {
                  setTitle('');
                  setBody('');
                }}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-black text-slate-800 hover:bg-slate-50 transition-colors"
              >
                Reset
              </button>
            </div>
          </form>
        )}

        {/* List */}
        {announcements.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 bg-white rounded-2xl p-10 text-center">
            <div className="text-xs font-black text-slate-500">Belum ada pengumuman.</div>
            <div className="text-[10px] font-semibold text-slate-400 mt-2">
              {isAdmin ? 'Buat pengumuman baru menggunakan form di atas.' : 'Tunggu pengumuman selanjutnya.'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => {
              const isEditing = editingId === a.id;

              return (
                <article
                  key={a.id}
                  className="border border-slate-200 bg-white rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {!isEditing ? (
                        <h2 className="text-sm md:text-[14px] font-black text-slate-900 truncate">
                          {a.title || '-'}
                        </h2>
                      ) : (
                        <div className="space-y-2">
                          <label className="block text-[11px] font-black text-slate-700">
                            Judul
                          </label>
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-0 focus:border-indigo-300"
                          />
                        </div>
                      )}

                      {!isEditing && (
                        <p className="text-[11px] font-bold text-slate-500 mt-1">
                          {formatDate(a.createdAt) || '—'}
                        </p>
                      )}
                    </div>

                    {!isEditing && isAdmin && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(a)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[11px] font-black hover:bg-indigo-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(a.id)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-700 text-[11px] font-black hover:bg-rose-50 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <form onSubmit={saveEdit} className="mt-3 space-y-3">
                      <div>
                        <label className="block text-[11px] font-black text-slate-700 mb-1">
                          Isi Pengumuman
                        </label>
                        <textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          className="w-full min-h-24 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-0 focus:border-indigo-300"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={!editTitle.trim() || !editBody.trim()}
                          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-black text-slate-800 hover:bg-slate-50 transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-[12px] font-semibold text-slate-800 mt-3 whitespace-pre-wrap">
                      {a.body || ''}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
