import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function TaskModal({ isOpen, onClose, onSave, task }) {
  const [formData, setFormData] = useState({ title: '', course: '', deadline: '', priority: 'Sedang', status: 'Belum Selesai' });

  useEffect(() => {
    if (task) setFormData(task);
    else setFormData({ title: '', course: '', deadline: '', priority: 'Sedang', status: 'Belum Selesai' });
  }, [task, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.course || !formData.deadline) return alert('Mohon lengkapi data!');
    onSave(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
          <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className="bg-white rounded-2xl shadow-xl border w-full max-w-md p-6 relative z-10 overflow-hidden">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="font-bold text-lg text-slate-800">{task ? 'Edit Tugas Kuliah' : 'Tambah Tugas Baru'}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Nama Tugas</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Mata Kuliah</label>
                <input type="text" value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Deadline</label>
                <input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Prioritas</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm bg-white focus:outline-none">
                    <option>Rendah</option><option>Sedang</option><option>Tinggi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm bg-white focus:outline-none">
                    <option>Belum Selesai</option><option>Selesai</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm py-2.5 rounded-xl shadow-lg hover:shadow-indigo-100 transition-all">Simpan Perubahan</button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}