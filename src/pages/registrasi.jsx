import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Check } from "lucide-react";
import { userService } from "../services/api";

export default function Registrasi() {
  const navigate = useNavigate();

  const [namaLengkap, setNamaLengkap] = useState("");
  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return (
      namaLengkap.trim().length >= 3 &&
      nim.trim().length >= 3 &&
      password.length >= 4 &&
      passwordConfirm === password
    );
  }, [namaLengkap, nim, password, passwordConfirm]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setNetworkError("");

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setNetworkError("Tidak ada internet. Periksa koneksi lalu coba lagi.");
      return;
    }

    if (!namaLengkap.trim() || namaLengkap.trim().length < 3) {
      setError("Nama lengkap wajib diisi.");
      return;
    }
    if (!nim.trim()) {
      setError("NIM wajib diisi.");
      return;
    }
    if (!password || password.length < 4) {
      setError("Password minimal 4 karakter.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }

    setLoading(true);
    try {
      // Backend /api/auth/register sudah validasi duplikat NIM
      const newUser = await userService.addUser({
        nim: nim.trim(),
        name: namaLengkap.trim(),
        role: "User",
        password,
        avatarUrl: "",
      });

      const currentUser = {
        uid: newUser.uid,
        nim: newUser.nim,
        name: newUser.name,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl || "",
      };

      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      navigate("/user-dashboard");
    } catch (err) {
      setError(err?.message || "Terjadi kesalahan saat registrasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen h-screen bg-[#ffffff] flex overflow-hidden font-sans selection:bg-cyan-500">

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
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 w-max px-3 py-1.5 rounded-full backdrop-blur-md mb-4">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 text-xs font-medium tracking-wide">SaaS Platform v2.0</span>
          </div>
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-3 leading-tight">
            Join Our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-teal-300">
              Community.
            </span>
          </h1>
          <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
            Daftar sekarang dan mulai perjalanan Anda dalam ekosistem pintar kami.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute bottom-8 flex items-center gap-4 text-slate-500 text-xs"
        >
          <p>© 2026 Crafted for Sahrul Aripiansyah</p>
          <p>All rights reserved.</p>
        </motion.div>
      </div>

      {/* RIGHT PANEL - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Glassmorphism Card */}
          <div className="bg-white-500 border border-green-800 p-6 rounded-3xl shadow-[0_0_40px_rgba(8,112,184,0.1)]">

            {/* Header Mobile Only */}
            <div className="lg:hidden mb-4 text-center">
              <h2 className="text-2xl font-black text-white mb-1">Buat Akun</h2>
              <p className="text-slate-400 text-xs">Daftar untuk memulai.</p>
            </div>

            {/* Header Desktop */}
            <div className="hidden lg:block mb-5">
              <h2 className="text-2xl font-bold text-white mb-1">Sign Up</h2>
              <p className="text-slate-400 text-xs">Buat akun baru untuk bergabung dengan platform kami.</p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-2 rounded-xl mb-4 flex items-center gap-2 text-xs"
              >
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0"></div>
                {error}
              </motion.div>
            )}

            <form onSubmit={handleRegister} className="space-y-3">

              {/* Nama Lengkap Input */}
              <div className="space-y-1 group">
                <label className="text-xs font-medium text-slate-300">Nama Lengkap</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 text-slate-500 group-focus-within:text-cyan-400 transition-colors duration-300 w-4 h-4" />
                  <input
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    className="w-full bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300 text-sm"
                  />
                </div>
              </div>

              {/* NIM Input */}
              <div className="space-y-1 group">
                <label className="text-xs font-medium text-slate-300">NIM</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 text-slate-500 group-focus-within:text-cyan-400 transition-colors duration-300 w-4 h-4" />
                  <input
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    type="text"
                    placeholder="Masukkan NIM Anda"
                    className="w-full bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300 text-sm"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1 group">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 text-slate-500 group-focus-within:text-purple-400 transition-colors duration-300 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Buat password"
                    className="w-full bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password Input */}
              <div className="space-y-1 group">
                <label className="text-xs font-medium text-slate-300">Konfirmasi Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 text-slate-500 group-focus-within:text-purple-400 transition-colors duration-300 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Ulangi password"
                    className="w-full bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-300 text-sm"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01, boxShadow: "0 0 20px rgba(34, 211, 238, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!canSubmit || loading}
                className="w-full bg-gradient-to-r from-purple-600 via-cyan-500 to-teal-400 text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 group relative overflow-hidden text-sm"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>

                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Daftar</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                Sudah punya akun?{' '}
                <a
                  href="/Login"
                  className="text-cyan-400 font-semibold hover:text-teal-300 transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-teal-300 hover:after:w-full after:transition-all after:duration-300"
                >
                  Masuk
                </a>
              </p>
            </div>

          </div>
        </motion.div>
      </div>

    </div>
  );
}
