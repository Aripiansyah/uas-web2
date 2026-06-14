import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Sparkles, Check } from 'lucide-react';
import { userService } from '../services/firebase';

export default function Login() {
  const navigate = useNavigate();
  
  // State bawaan Anda
  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State tambahan untuk UI modern (opsional, untuk mempermanis UI)
  const [rememberMe, setRememberMe] = useState(false);

  // Logika asli Anda tetap dipertahankan utuh
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validasi input
      if (!nim || !password) {
        setError('NIM dan password harus diisi');
        setLoading(false);
        return;
      }

      // Login dari database
      const userData = await userService.loginUser(nim, password);
      
      const normalizeRole = (role) => {
        if (!role) return '';
        const r = String(role).trim().toLowerCase();
        if (r.includes('admin')) return 'Admin';
        if (r === 'user' || r.includes('user') || r.includes('student') || r.includes('mahasiswa')) return 'User';
        return role;
      };

      const normalizedRole = normalizeRole(userData.role);
      const normalizedUserData = { ...userData, role: normalizedRole };

      // Simpan ke localStorage
      localStorage.setItem('currentUser', JSON.stringify(normalizedUserData));

      // Redirect berdasarkan role
      if (normalizedRole === 'Admin') {
        navigate('/');
      } else {
        navigate('/user-dashboard');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan sistem saat login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] flex overflow-hidden font-sans selection:bg-cyan-500">
      
      {/* Background Animated Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.2, 0.3] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-white/30 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            rotate: [0, -90, 0],
            opacity: [0.2, 0.3, 0.2] 
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-cyan-500/20 blur-[120px]"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* LEFT PANEL - Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 w-max px-4 py-2 rounded-full backdrop-blur-md mb-8">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="text-slate-300 text-sm font-medium tracking-wide">Classify v2.0</span>
          </div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6 leading-tight">
            TASK APLICATION <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-teal-300">
              TIF PK 23.
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md leading-relaxed">
            Tugasmu menentukan kompetensi dan masa depanmu.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex items-center gap-4 text-slate-500 text-sm"
        >
          <p>© 2026 Crafted for Sahrul Aripiansyah</p>
          <p>All rights reserved.</p>
        </motion.div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Glassmorphism Card */}
          <div className="bg-white-500 border border-green-800 p-8 rounded-3xl shadow-[0_0_40px_rgba(8,112,184,0.1)]">
            
            {/* Header Mobile Only */}
            <div className="lg:hidden mb-8 text-center">
              <h2 className="text-3xl font-black text-white mb-2">Selamat Datang</h2>
              <p className="text-slate-400 text-sm">Masuk untuk melanjutkan.</p>
            </div>

            {/* Header Desktop */}
            <div className="hidden lg:block mb-10">
              <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
              <p className="text-slate-400 text-sm">Masukan NIM dan password untuk melanjutkan.</p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 text-sm"
              >
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              
              {/* NIM Input */}
              <div className="space-y-2 group">
                <label className="text-sm font-medium text-slate-700" >NIM</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors duration-300 w-5 h-5" />
                  <input
                    type="text"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    placeholder="Masukkan NIM Anda"
                    className="w-full bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2 group">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <a href="#" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium">Lupa Password?</a>
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 text-slate-500 group-focus-within:text-purple-400 transition-colors duration-300 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-300 ${
                    rememberMe 
                      ? 'bg-gradient-to-r from-purple-500 to-cyan-500 border-transparent' 
                      : 'border-slate-700 bg-slate-950/50'
                  }`}
                >
                  {rememberMe && <Check className="w-3 h-3 text-white" />}
                </button>
                <label 
                  onClick={() => setRememberMe(!rememberMe)}
                  className="text-sm text-slate-400 cursor-pointer select-none hover:text-slate-300 transition-colors"
                >
                  Ingat saya selama 30 hari
                </label>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01, boxShadow: "0 0 20px rgba(34, 211, 238, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 via-cyan-500 to-teal-400 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 group relative overflow-hidden"
              >
                {/* Shine effect animation */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
                
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <p className="text-sm text-slate-400">
                Belum punya akun?{' '}
                <a
                  href="/Registrasi"
                  className="text-cyan-400 font-semibold hover:text-teal-300 transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-teal-300 hover:after:w-full after:transition-all after:duration-300"
                >
                  Daftar
                </a>
                {' '}•{' '}
              </p>
            </div>

          </div>
        </motion.div>
      </div>

    </div>
  );
}
