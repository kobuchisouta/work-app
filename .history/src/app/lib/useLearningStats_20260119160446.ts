"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

type WatchedDoc = {
  title?: string;
  skillTags?: string[];
  durationSec?: number | null;
  progress?: number;
  lastWatchedAt?: { seconds: number; nanoseconds: number }; // Firestore Timestamp 互換
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

export function useLearningStats(uid: string | null) {
  const [docs, setDocs] = useState<WatchedDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!uid) {
        setDocs([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const snap = await getDocs(collection(db, "users", uid, "watchedVideos"));
      setDocs(snap.docs.map((d) => d.data() as WatchedDoc));
      setLoading(false);
    })();
  }, [uid]);

  const stats = useMemo(() => {
    // ① スキル円グラフ（React/Next/Firebase）
    const skillCount = new Map<string, number>([
      ["React", 0],
      ["Next", 0],
      ["Firebase", 0],
    ]);

    // ② 進捗円グラフ（完了/途中）
    let completed = 0;
    let inProgress = 0;

    // ③ 週ごとの学習量（本数 / 学習時間）
    const weekly = new Map<string, { videos: number; minutes: number }>();

    for (const d of docs) {
      const tags = d.skillTags ?? [];
      for (const t of tags) {
        if (skillCount.has(t)) skillCount.set(t, (skillCount.get(t) ?? 0) + 1);
      }

      const p = d.progress ?? 0;
      if (p >= 0.99) completed += 1;
      else inProgress += 1;

      const dt = toDate(d.lastWatchedAt);
      if (dt) {
        const wk = weekKey(dt);
        const prev = weekly.get(wk) ?? { videos: 0, minutes: 0 };
        const minutes = Math.round(((d.durationSec ?? 0) as number) / 60);
        weekly.set(wk, {
          videos: prev.videos + 1,
          minutes: prev.minutes + minutes,
        });
      }
    }

    const skillPie = Array.from(skillCount.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    const progressPie = [
      { name: "完了", value: completed },
      { name: "途中", value: inProgress },
    ];

    const weeklySeries = Array.from(weekly.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([week, v]) => ({
        week, // "YYYY-MM-DD" (週の月曜)
        videos: v.videos,
        minutes: v.minutes,
      }));

    return { skillPie, progressPie, weeklySeries, total: docs.length };
  }, [docs]);

  return { loading, docs, stats };
}
