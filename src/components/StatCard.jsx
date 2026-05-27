import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ title, value, icon: Icon, gradient }) {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`p-6 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-xl shadow-slate-100 relative overflow-hidden`}
    >
      <div className="absolute -right-6 -bottom-6 opacity-15 text-white pointer-events-none">
        <Icon size={120} />
      </div>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-white/80 text-sm font-medium tracking-wide mb-1">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
        </div>
        <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/20">
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
}