import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react'; // Pastikan icon sudah di-import

export default function Sidebar() {
  const navigate = useNavigate(); // 👈 1. Inisialisasi navigate

  // 2. Buat fungsi handling logout
  const handleLogout = () => {
    if (confirm('Apakah kamu yakin ingin keluar dari SyncTask?')) {
      // Hapus data session login dari localStorage
      localStorage.removeItem('currentUser'); 
      
      // Tendang balik ke halaman login secara bersih
      navigate('/login', { replace: true }); 
    }
  };

  return (
    <div className="flex flex-col h-full justify-between">
      {/* ... Menu atas sidebar kamu ... */}

      {/* 3. Pasang fungsi handleLogout di onClick button kamu */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50/60 rounded-xl text-xs font-bold transition-all mt-auto group"
      >
        <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
        <span>Keluar Aplikasi</span>
      </button>
    </div>
  );
}