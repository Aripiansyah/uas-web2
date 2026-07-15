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
  completed: "#8b5cf6",
  pending: "#06b6d4",
  pendingMuted: "#0ea5e9",
};

function getTaskSubject(task) {
  return task?.matkul || task?.course || "Belum Ada";
}

function isTaskCompleted(task, completedTaskIds) {
  if (Array.isArray(completedTaskIds)) {
    return completedTaskIds.includes(task?.id);
  }
  if (task?.isCompleted === true) return true;

  if (typeof task?.status === "string") return task.status === "Selesai";

  return false;
}

function toSafeNumber(v) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function SubjectCompletionBarChart({
  tasks = [],
  completedTaskIds,
  maxSubjects = 8,
  title = "Subject Completion Breakdown",
}) {
  const { data, totalCompleted, totalPending } = useMemo(() => {
    const map = new Map();

    for (const task of tasks) {
      const subject = getTaskSubject(task);
      if (!map.has(subject)) {
        map.set(subject, { subject, completed: 0, pending: 0 });
      }

      const entry = map.get(subject);
      const completed = isTaskCompleted(task, completedTaskIds);
      if (completed) entry.completed += 1;
      else entry.pending += 1;
    }

    const arr = Array.from(map.values());

    const sorted = arr
      .sort((a, b) => (b.completed + b.pending) - (a.completed + a.pending))
      .slice(0, maxSubjects);

    const completedSum = sorted.reduce((sum, e) => sum + e.completed, 0);
    const pendingSum = sorted.reduce((sum, e) => sum + e.pending, 0);

    return {
      data: sorted.map((e) => ({
        ...e,
        total: e.completed + e.pending,
        rate: e.completed + e.pending > 0 ? e.completed / (e.completed + e.pending) : 0,
      })),
      totalCompleted: completedSum,
      totalPending: pendingSum,
    };
  }, [tasks, completedTaskIds, maxSubjects]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const completed = payload.find((p) => p.dataKey === "completed")?.value ?? 0;
    const pending = payload.find((p) => p.dataKey === "pending")?.value ?? 0;
    const total = toSafeNumber(completed) + toSafeNumber(pending);
    const rate = total > 0 ? Math.round((toSafeNumber(completed) / total) * 100) : 0;

    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-100 rounded-xl shadow-md">
        <p className="text-xs font-black text-slate-900 mb-1">{label}</p>
        <div className="flex items-center gap-2 text-[11px] font-bold text-purple-600 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.completed }} />
          {toSafeNumber(completed)} Completed
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-cyan-600 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.pending }} />
          {toSafeNumber(pending)} Pending
        </div>
        <p className="text-[10px] font-semibold text-slate-500">
          Completion rate: {rate}%
        </p>
      </div>
    );
  };

  const completedTotalSubjects = data.reduce((sum, e) => sum + e.completed, 0);
  const pendingTotalSubjects = data.reduce((sum, e) => sum + e.pending, 0);

  return (
    <div className="soft-card border border-slate-200 p-6 rounded-2xl shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h3 className="text-lg font-bold text-gradient">{title}</h3>
          <p className="text-xs text-slate-400 mt-1">
            Completed vs Pending assignments by subject (realtime).
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.completed }} />
            Completed: {completedTotalSubjects}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.pending }} />
            Pending: {pendingTotalSubjects}
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="w-full h-[260px] border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center p-4">
          <p className="text-xs font-bold text-slate-400 uppercase">No subject activity yet</p>
        </div>
      ) : (
        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="subject"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                fontWeight={700}
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                fontSize={11}
                fontWeight={700}
              />
              <Tooltip content={<CustomTooltip />} />

              <Bar
                dataKey="completed"
                stackId="a"
                animationDuration={650}
                fill={COLORS.completed}
              >
                {data.map((_, idx) => (
                  <Cell key={`c-${idx}`} fill={COLORS.completed} />
                ))}
              </Bar>

              <Bar
                dataKey="pending"
                stackId="a"
                animationDuration={650}
                fill={COLORS.pending}
              >
                {data.map((_, idx) => (
                  <Cell key={`p-${idx}`} fill={COLORS.pending} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
