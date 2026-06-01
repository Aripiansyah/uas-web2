import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';

const COLORS = {
  high: '#ff0000', // red accent
  medium: '#06b6d4', // cyan accent
  low: '#14b8a6', // aqua/teal accent
};

const SUBJECT_AXES = [
  "Web 2",
  "(ADA)",
  "Metopen",
  "Data Mining",
  "PPL",
  "Sistem Mikrokontroler",
  "TPLI",
];

function getTaskSubject(task) {
  return task?.matkul || task?.course || "Belum Ada";
}

// Map nama mata kuliah di database ke label sumbu radar yang diminta.
// Tujuannya: supaya count dari DB masuk ke axes yang benar.
function normalizeSubjectToAxis(subjectRaw) {
  const s = String(subjectRaw || "").trim().toLowerCase();

  // Web 2 / Pemrograman Web 2
  if (s.includes("web") && s.includes("2")) return "Web 2";

  // ADA
  if (s.includes("(ada)") || s.includes(" ada") || s.includes("ada")) return "(ADA)";

  // Metopen (Metodologi Penelitian Informatika)
  if (s.includes("metopen") || s.includes("metodologi") || s.includes("penelitian")) return "Metopen";

  // Data Mining
  if (s.includes("data mining") || s.includes("penambangan data")) return "Data Mining";

  // PPL (Pengujian Perangkat Lunak)
  if (s.includes("ppl") || s.includes("pengujian") || s.includes("perangkat lunak")) return "PPL";

  // Sistem Mikrokontroler
  if (s.includes("sistem mikrokontroler") || s.includes("mikrokontroler")) return "Sistem Mikrokontroler";

  // TPLI (Teknik Penulisan Literatur Ilmiah)
  if (s.includes("tpli") || s.includes("penulisan") || s.includes("literatur") || s.includes("ilmiah")) return "TPLI";

  return null;
}

function safeNumber(value) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function pickRadarAxes(entries, maxAxes, averageCount) {
  if (entries.length <= maxAxes) return entries;

  const sortedDesc = [...entries].sort((a, b) => b.count - a.count);
  const sortedAsc = [...entries].sort((a, b) => a.count - b.count);

  // Represent the 3 categories across the limited radar axes
  const highN = Math.max(1, Math.round(maxAxes / 3));
  const lowN = Math.max(1, Math.round(maxAxes / 3));
  const moderateN = Math.max(1, maxAxes - highN - lowN);

  const top = sortedDesc.slice(0, highN);
  const bottom = sortedAsc.slice(0, lowN);

  const topSubjects = new Set(top.map((e) => e.subject));
  const bottomSubjects = new Set(bottom.map((e) => e.subject));

  const moderateCandidates = entries
    .filter((e) => !topSubjects.has(e.subject) && !bottomSubjects.has(e.subject))
    .sort((a, b) => Math.abs(a.count - averageCount) - Math.abs(b.count - averageCount));

  const moderate = moderateCandidates.slice(0, moderateN);

  const bySubject = new Map();
  [...top, ...moderate, ...bottom].forEach((e) => bySubject.set(e.subject, e));
  return Array.from(bySubject.values()).slice(0, maxAxes);
}

function computeHighMediumLow(entries) {
  // entries: [{ subject, count }]
  const n = entries.length;
  if (n === 0) return { high: new Set(), low: new Set() };

  const sortedDesc = [...entries].sort((a, b) => b.count - a.count);
  const highN = Math.max(1, Math.round(n / 3));
  const lowN = Math.max(1, Math.round(n / 3));

  const high = new Set(sortedDesc.slice(0, highN).map((e) => e.subject));
  const low = new Set(sortedDesc.slice(Math.max(0, n - lowN)).map((e) => e.subject));

  return { high, low };
}

function formatNumber(n) {
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= 100) return String(Math.round(n));
  if (Math.abs(n) >= 10) return String(Math.round(n));
  return n.toFixed(1);
}

export default function AssignmentFrequencyRadar({ tasks = [] }) {
  const {
    radarData,
    legendItems,
    mostActive,
    leastActive,
    average,
    maxCount,
  } = useMemo(() => {
    // Force radar axes always exist (even if count=0)
    const subjectCountMap = new Map(SUBJECT_AXES.map((axis) => [axis, 0]));

    for (const task of tasks) {
      const rawSubject = getTaskSubject(task);
      const axis = normalizeSubjectToAxis(rawSubject);
      if (!axis) continue;

      const prev = subjectCountMap.get(axis) ?? 0;
      subjectCountMap.set(axis, prev + 1);
    }

    const allEntries = SUBJECT_AXES.map((axis) => ({
      subject: axis,
      count: subjectCountMap.get(axis) ?? 0,
    }));

    const counts = allEntries.map((e) => e.count);
    const totalSubjects = allEntries.length;

    const averageCount =
      totalSubjects > 0 ? counts.reduce((sum, c) => sum + c, 0) / totalSubjects : 0;

    const most = allEntries.length
      ? [...allEntries].sort((a, b) => b.count - a.count)[0]
      : null;

    const least = allEntries.length
      ? [...allEntries].sort((a, b) => a.count - b.count)[0]
      : null;

    const max = counts.length ? Math.max(...counts) : 0;

    const selected = pickRadarAxes(allEntries, 8, averageCount);

    // Classify within the radar axes so we always get:
    // - Frequently Assigned (highest counts)
    // - Moderately Assigned (middle/average-ish counts)
    // - Rarely Assigned (lowest counts)
    const sortedSelected = [...selected].sort((a, b) => b.count - a.count);
    const highN = Math.max(1, Math.round(sortedSelected.length / 3));
    const lowN = Math.max(1, Math.round(sortedSelected.length / 3));

    const highSubjects = new Set(sortedSelected.slice(0, highN).map((e) => e.subject));
    const lowSubjects = new Set(sortedSelected.slice(Math.max(0, sortedSelected.length - lowN)).map((e) => e.subject));

    const radar = selected
      .map((e) => {
        if (highSubjects.has(e.subject)) {
          return { subject: e.subject, high: e.count, medium: null, low: null };
        }
        if (lowSubjects.has(e.subject)) {
          return { subject: e.subject, high: null, medium: null, low: e.count };
        }
        return { subject: e.subject, high: null, medium: e.count, low: null };
      })
      .sort((a, b) => {
        const av = safeNumber(a.high) + safeNumber(a.medium) + safeNumber(a.low);
        const bv = safeNumber(b.high) + safeNumber(b.medium) + safeNumber(b.low);
        return bv - av;
      });

    const legend = [
      { key: 'Frequent', color: COLORS.high, label: 'Frequently Assigned' },
      { key: 'Moderate', color: COLORS.medium, label: 'Moderately Assigned' },
      { key: 'Rare', color: COLORS.low, label: 'Rarely Assigned' },
    ];

    return {
      radarData: radar,
      legendItems: legend,
      mostActive: most,
      leastActive: least,
      average: averageCount,
      maxCount: max,
    };
  }, [tasks]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const subject = label;

    const highPayload = payload.find((p) => p.dataKey === 'high');
    const mediumPayload = payload.find((p) => p.dataKey === 'medium');
    const lowPayload = payload.find((p) => p.dataKey === 'low');

    const value =
      (typeof highPayload?.value === 'number' ? highPayload.value : null) ??
      (typeof mediumPayload?.value === 'number' ? mediumPayload.value : null) ??
      (typeof lowPayload?.value === 'number' ? lowPayload.value : null) ??
      0;

    let category = '—';
    let color = '#94a3b8';

    if (typeof highPayload?.value === 'number' && highPayload.value > 0) {
      category = 'Frequently Assigned';
      color = COLORS.high;
    } else if (typeof mediumPayload?.value === 'number' && mediumPayload.value > 0) {
      category = 'Moderately Assigned';
      color = COLORS.medium;
    } else if (typeof lowPayload?.value === 'number' && lowPayload.value > 0) {
      category = 'Rarely Assigned';
      color = COLORS.low;
    }

    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-100 rounded-xl shadow-md">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <p className="text-xs font-black text-slate-900">{subject}</p>
        </div>
        <p className="text-[11px] font-bold text-indigo-600">
          {value} Assignments
        </p>
        <p className="text-[10px] font-semibold text-slate-500">{category}</p>
      </div>
    );
  };

  return (
    <div className="soft-card border border-slate-200 p-6 rounded-2xl shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-gradient flex items-center gap-2">
            <span aria-hidden>📡</span> Assignment Analytics
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Assignment distribution across academic subjects based on real-time task activity.
          </p>
        </div>

        {tasks.length === 0 && (
          <div className="px-3 py-1 bg-slate-500/10 text-slate-500 rounded-full text-xs font-bold border border-slate-200">
            No task data
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4 flex-wrap">
        {legendItems.map((item) => (
          <div key={item.key} className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 w-full h-[340px] sm:h-[360px]">
        {radarData.length === 0 ? (
          <div className="w-full h-full border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center p-4">
            <p className="text-xs font-bold text-slate-400 uppercase">No subject assignments yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              data={radarData}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="subject"
                stroke="#94a3b8"
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
              />
              <PolarRadiusAxis
                stroke="#94a3b8"
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                domain={[0, Math.max(1, maxCount)]}
              />

              <Tooltip content={<CustomTooltip />} />

              <Radar
                name="High Activity"
                dataKey="high"
                stroke={COLORS.high}
                fill={COLORS.high}
                fillOpacity={0.18}
                dot={{ r: 3, strokeWidth: 2 }}
                activeDot={{ r: 5 }}
                isAnimationActive
                animationDuration={700}
              />
              <Radar
                name="Medium Activity"
                dataKey="medium"
                stroke={COLORS.medium}
                fill={COLORS.medium}
                fillOpacity={0.16}
                dot={{ r: 3, strokeWidth: 2 }}
                activeDot={{ r: 5 }}
                isAnimationActive
                animationDuration={700}
              />
              <Radar
                name="Low Activity"
                dataKey="low"
                stroke={COLORS.low}
                fill={COLORS.low}
                fillOpacity={0.14}
                dot={{ r: 3, strokeWidth: 2 }}
                activeDot={{ r: 5 }}
                isAnimationActive
                animationDuration={700}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-black tracking-wider text-purple-500">
            Most Active Subject
          </p>
          <p className="text-sm font-black text-slate-900 mt-1 line-clamp-1">
            {mostActive?.subject || '—'}
          </p>
          <p className="text-xs font-bold text-slate-600 mt-1">
            {mostActive ? `${mostActive.count} assignments` : '—'}
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-black tracking-wider text-cyan-500">
            Average Assignments Per Subject
          </p>
          <p className="text-sm font-black text-slate-900 mt-1">
            {totalSubjectsText(mostActive, leastActive, average)}
          </p>
          <p className="text-xs font-bold text-slate-600 mt-1">
            {tasks.length === 0 ? '—' : `${formatNumber(average)} average`}
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-black tracking-wider text-teal-500">
            Least Active Subject
          </p>
          <p className="text-sm font-black text-slate-900 mt-1 line-clamp-1">
            {leastActive?.subject || '—'}
          </p>
          <p className="text-xs font-bold text-slate-600 mt-1">
            {leastActive ? `${leastActive.count} assignments` : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

function totalSubjectsText(mostActive, leastActive, average) {
  const has = Boolean(mostActive || leastActive);
  if (!has) return '0';
  return formatNumber(average);
}
