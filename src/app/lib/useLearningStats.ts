"use client";

import { useMemo } from "react";

export type WatchedDoc = {
  title?: string;
  skillTags?: string[];
  durationSec?: number | null;
  progress?: number; // 0〜1
  lastWatchedAt?: { seconds: number; nanoseconds: number };
  videoId?: string;
};

function toDate(ts?: { seconds: number; nanoseconds: number }) {
  if (!ts?.seconds) return null;
  return new Date(ts.seconds * 1000);
}

// 月曜始まりの週キー "YYYY-MM-DD"
function weekKey(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun ... 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function useLearningStats(watched: WatchedDoc[]) {
  return useMemo(() => {
    const skillCount = new Map<string, number>();
    let completed = 0;
    let inProgress = 0;

    const weekly = new Map<string, { videos: number; minutes: number }>();

    for (const d of watched) {
      // スキル集計
      for (const t of d.skillTags ?? []) {
        skillCount.set(t, (skillCount.get(t) ?? 0) + 1);
      }

      // 進捗
      const p = d.progress ?? 0;
      if (p >= 0.99) completed += 1;
      else inProgress += 1;

      // 週
      const dt = toDate(d.lastWatchedAt);
      if (dt) {
        const wk = weekKey(dt);
        const prev = weekly.get(wk) ?? { videos: 0, minutes: 0 };
        const minutes = Math.round(((d.durationSec ?? 0) as number) / 60);
        weekly.set(wk, { videos: prev.videos + 1, minutes: prev.minutes + minutes });
      }
    }

    const skillPie = Array.from(skillCount.entries()).map(([name, value]) => ({ name, value }));
    const progressPie = [
      { name: "完了", value: completed },
      { name: "途中", value: inProgress },
    ];

    const weeklySeries = Array.from(weekly.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([week, v]) => ({ week, videos: v.videos, minutes: v.minutes }));

    // 完了/途中の動画一覧（表示用）
    const completedList = watched.filter((w) => (w.progress ?? 0) >= 0.99);
    const inProgressList = watched.filter((w) => (w.progress ?? 0) < 0.99);

    // 総学習時間
    const totalMinutes = watched.reduce((sum, w) => sum + Math.round(((w.durationSec ?? 0) as number) / 60), 0);

    return { skillPie, progressPie, weeklySeries, completedList, inProgressList, totalMinutes };
  }, [watched]);
}
