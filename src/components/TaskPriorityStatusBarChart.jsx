import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

const COLORS = {
  completed: "#10b981", // emerald
  pending: "#8b5cf6", // purple
};

function getTaskPriority(task) {
  // In your user tasks, priority is "High" | "Medium" | "Low"
  return task?.priority || "Medium";
}

function isTaskCompleted(task, completedTaskIds) {
  const taskKey = task?.id ?? task?.taskId;

  // Prefer explicit per-user completion ids
  if (Array.isArray(completedTaskIds)) {
    if (!taskKey) return false;
    return completedTaskIds.includes(taskKey);
  }

  // Fallback to legacy/global status fields
  if (typeof task?.status === "string") return task.status === "Selesai";
  if (task?.isCompleted === true) return true;

  return false;
}

export default function TaskPriorityStatusBarChart({
  tasks = [],
  completedTaskIds,
  title = "Priority vs Completion",
}) {
  const { data, totalCompleted, totalPending } = useMemo(() => {
    const map = {
      High: { priority: "High", completed: 0, pending: 0 },
      Medium: { priority: "Medium", completed: 0, pending: 0 },
      Low: { priority: "Low", completed: 0, pending: 0 },
    };

    for (const t of tasks) {
      const pr = getTaskPriority(t);
      const row = map[pr] ?? map.Medium;
      if (isTaskCompleted(t, completedTaskIds)) row.completed += 1;
      else row.pending += 1;
    }

    const arr = [map.High, map.Medium, map.Low];

    const totalC = arr.reduce((sum, e) => sum + e.completed, 0);
    const totalP = arr.reduce((sum, e) => sum + e.pending, 0);

    return { data: arr, totalCompleted: totalC, totalPending: totalP };
  }, [tasks, completedTaskIds]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    const completed = payload.find((p) => p.dataKey === "completed")?.value ?? 0;
    const pending = payload.find((p) => p.dataKey === "pending")?.value ?? 0;

    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-100 rounded-xl shadow-md">
        <p className="text-xs font-black text-slate-900 mb-2">{label}</p>
        <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-600 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.completed }} />
          {completed} Completed
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-purple-600">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.pending }} />
          {pending} Pending
        </div>
      </div>
    );
  };

  return (
    <div className="soft-card border border-slate-200 p-6 rounded-2xl min-w-0 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-6">
        <h3 className="text-base font-bold text-slate-900">Priority Completion</h3>
        <p className="text-xs text-slate-400">{title}</p>
      </div>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis dataKey="priority" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />

            <Bar dataKey="completed" fill={COLORS.completed} radius={[6, 6, 0, 0]}>
              {data.map((_, idx) => (
                <Cell key={`c-${idx}`} fill={COLORS.completed} />
              ))}
            </Bar>

            <Bar dataKey="pending" fill={COLORS.pending} radius={[6, 6, 0, 0]}>
              {data.map((_, idx) => (
                <Cell key={`p-${idx}`} fill={COLORS.pending} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="flex items-center gap-2 text-xs p-3 rounded-lg bg-slate-50 border border-slate-200">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.pending }} />
          <span className="font-medium text-slate-700">Pending Total: {totalPending}</span>
        </div>
        <div className="flex items-center gap-2 text-xs p-3 rounded-lg bg-slate-50 border border-slate-200">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.completed }} />
          <span className="font-medium text-slate-700">Completed Total: {totalCompleted}</span>
        </div>
      </div>
    </div>
  );
}
