import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Crown } from "lucide-react";

const subjects = ["คณิตศาสตร์ 1", "คณิตศาสตร์ 2", "ฟิสิกส์", "เคมี", "ชีววิทยา", "ภาษาอังกฤษ", "ภาษาไทย", "สังคมศึกษา"];

const quickLinks = [
  { to: "/subjects", label: "วัดระดับความรู้", sub: "Placement Test ฟรี" },
  { to: "/practice", label: "ฝึกทำข้อสอบ", sub: "AI สร้างข้อสอบให้" },
  { to: "/battle", label: "Quiz Battle", sub: "ท้าเพื่อนแข่ง" },
  { to: "/tournament", label: "Tournament", sub: "แข่งชิงอันดับ" },
];

export default function Home() {
  const { user } = useAuth();

  const { data: quizzes = [] } = useQuery({
    queryKey: ["recent-quizzes"],
    queryFn: () => base44.entities.Quiz.filter({ completed: true }, "-created_date", 5),
  });

  const { data: placements = [] } = useQuery({
    queryKey: ["placements"],
    queryFn: () => base44.entities.PlacementTest.filter({ completed: true }, "-created_date", 10),
  });

  const subjectLevels = user?.subject_levels || {};

  const avgScore = quizzes.length > 0
    ? Math.round(quizzes.reduce((a, q) => a + ((q.score / q.total_questions) * 100), 0) / quizzes.length)
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-10">

      {/* Header */}
      <div className="pt-2">
        <p className="text-sm text-muted-foreground mb-1">สวัสดี, {user?.full_name || "นักเรียน"}</p>
        <h1 className="text-2xl font-display font-bold tracking-tight">
          พร้อมเรียนวันนี้แล้วหรือยัง?
        </h1>
        {user?.is_premium && (
          <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <Crown className="w-3 h-3" /> AI Pro
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-3xl font-display font-bold">{user?.tokens ?? 50}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Tokens</p>
        </div>
        <div>
          <p className="text-3xl font-display font-bold">{quizzes.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">ข้อสอบที่ทำ</p>
        </div>
        <div>
          <p className="text-3xl font-display font-bold">{avgScore !== null ? `${avgScore}%` : "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">คะแนนเฉลี่ย</p>
        </div>
      </div>

      {/* Subject Levels */}
      {Object.keys(subjectLevels).length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">เลเวลรายวิชา</p>
          <div className="space-y-2">
            {subjects.map(s => {
              const lv = subjectLevels[s];
              if (!lv) return null;
              return (
                <div key={s} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm">{s}</span>
                  <span className="text-sm font-medium text-primary">Lv.{lv}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">เมนูหลัก</p>
        <div className="space-y-1">
          {quickLinks.map(({ to, label, sub }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center justify-between py-3 px-0 border-b border-border last:border-0 group hover:text-primary transition-colors"
            >
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* AI Pro Upgrade */}
      {!user?.is_premium && (
        <div className="border border-border rounded-xl p-5">
          <p className="text-sm font-semibold mb-1">AI Pro — ฿109/เดือน</p>
          <p className="text-xs text-muted-foreground mb-4">คำอธิบายละเอียด · แผนเรียนส่วนตัว · แถม 200 Tokens</p>
          <Link to="/tokens">
            <button className="text-xs font-medium text-primary hover:underline">
              อัปเกรดเลย →
            </button>
          </Link>
        </div>
      )}

      {/* Recent Placements */}
      {placements.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">ผลวัดระดับล่าสุด</p>
          <div className="space-y-2">
            {placements.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm">{p.subject}</p>
                  <p className="text-xs text-muted-foreground">คะแนน {p.score}/10</p>
                </div>
                <span className="text-sm font-medium text-muted-foreground">Level {p.result_level}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}