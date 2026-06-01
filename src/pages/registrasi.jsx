import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDocs, query, collection, where, addDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export default function Registrasi() {
  const navigate = useNavigate();

  const [namaLengkap, setNamaLengkap] = useState("");
  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

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
      // Check if NIM already exists
      const q = query(collection(db, "users"), where("nim", "==", nim.trim()));
      const existing = await getDocs(q);
      if (!existing.empty) {
        setError("NIM sudah terdaftar. Silakan login.");
        return;
      }

      const docRef = await addDoc(collection(db, "users"), {
        nim: nim.trim(),
        name: namaLengkap.trim(),
        role: "User",
        password, // NOTE: app currently uses plain password comparison in loginUser()
        avatarUrl: "",
        totalPoints: 0,
        quizzesCompleted: 0,
        createdAt: new Date(),
      });

      // Auto-login to connect register -> login flow
      const currentUser = {
        uid: docRef.id,
        nim: nim.trim(),
        name: namaLengkap.trim(),
        role: "User",
        avatarUrl: "",
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
    <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-lg p-6">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Registrasi</h1>
        <p className="text-sm text-slate-500 mb-6">Buat akun untuk masuk ke dashboard.</p>

        {networkError && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm font-bold">
            {networkError}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Nama Lengkap</label>
            <input
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              type="text"
              placeholder="Masukkan nama lengkap"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">NIM</label>
            <input
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              type="text"
              placeholder="Masukkan NIM"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Buat password"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Konfirmasi Password</label>
            <input
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              type="password"
              placeholder="Ulangi password"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full mt-2 py-3 rounded-xl bg-slate-900 text-white text-sm font-extrabold hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Membuat akun..." : "Daftar"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all"
          >
            Kembali ke Login
          </button>
        </form>
      </div>
    </div>
  );
}
