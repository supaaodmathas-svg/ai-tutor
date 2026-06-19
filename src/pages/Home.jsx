import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react";

const subjects = ["คณิตศาสตร์ 1", "คณิตศาสตร์ 2", "ฟิสิกส์", "เคมี", "ชีววิทยา", "ภาษาอังกฤษ", "ภาษาไทย", "สังคมศึกษา"];

const quickLinks = [
  { to: "/subjects", label: "วัดระดับความรู้", sub: "Placement Test ฟรี!", emoji: "📝", color: "bg-purple-50 border-purple-200 hover:bg-purple-100" },
  { to: "/practice", label: "ฝึกทำข้อสอบ", sub: "AI สร้างข้อสอบให้", emoji: "✏️", color: "bg-pink-50 border-pink-200 hover:bg-pink-100" },
  { to: "/battle", label: "Quiz Battle", sub: "ท้าเพื่อนแข่ง", emoji: "⚔️", color: "bg-orange-50 border-orange-200 hover:bg-orange-100" },
  { to: "/tournament", label: "Tournament", sub: "แข่งชิงอันดับ", emoji: "🏆", color: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100" },
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
    <div className="space-y-6 pb-10">

      {/* Hero greeting */}
      <div className="bg-white rounded-3xl p-6 border-2 border-purple-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-3 right-4 text-3xl">🌟</div>
        <p className="text-sm font-semibold text-muted-foreground mb-1">สวัสดี 👋</p>
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          {user?.full_name || "นักเรียน"}!
        </h1>
        <p className="text-sm text-muted-foreground">วันนี้จะเรียนรู้อะไรดี? 🚀</p>
        {user?.is_premium && (
          <span className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full">
            <Crown className="w-3 h-3" /> AI Pro ✨
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-3xl p-4 text-center border-2 border-purple-100 shadow-sm">
          <p className="text-2xl font-display font-bold text-primary">⚡ {user?.tokens ?? 50}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1">Tokens</p>
        </div>
        <div className="bg-white rounded-3xl p-4 text-center border-2 border-pink-100 shadow-sm">
          <p className="text-2xl font-display font-bold text-accent">📝 {quizzes.length}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1">ข้อสอบที่ทำ</p>
        </div>
        <div className="bg-white rounded-3xl p-4 text-center border-2 border-yellow-100 shadow-sm">
          <p className="text-2xl font-display font-bold text-amber-500">⭐ {avgScore !== null ? `${avgScore}%` : "—"}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1">คะแนนเฉลี่ย</p>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <p className="text-sm font-bold text-muted-foreground mb-3">🎮 เมนูหลัก</p>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map(({ to, label, sub, emoji, color }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col gap-1 p-4 rounded-3xl border-2 transition-all duration-150 active:scale-95 ${color}`}
            >
              <span className="text-3xl">{emoji}</span>
              <p className="font-bold text-sm text-foreground mt-1">{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Subject Levels */}
      {Object.keys(subjectLevels).length > 0 && (
        <div>
          <p className="text-sm font-bold text-muted-foreground mb-3">📊 เลเวลรายวิชา</p>
          <div className="bg-white rounded-3xl border-2 border-purple-100 shadow-sm divide-y divide-purple-50">
            {subjects.map(s => {
              const lv = subjectLevels[s];
              if (!lv) return null;
              return (
                <div key={s} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm font-semibold">{s}</span>
                  <span className="text-sm font-bold text-primary bg-purple-50 px-3 py-0.5 rounded-full">Lv.{lv} ⭐</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Pro Upgrade */}
      {!user?.is_premium && (
        <div className="bg-white rounded-3xl border-2 border-pink-200 p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-3 right-4 text-2xl">✨</div>
          <p className="font-bold text-base mb-1">🌈 AI Pro</p>
          <p className="text-xs text-muted-foreground mb-1">คำอธิบายละเอียด · แผนเรียนส่วนตัว</p>
          <p className="text-lg font-display font-bold text-primary mb-3">฿109 <span className="text-xs font-normal text-muted-foreground">/เดือน</span></p>
          <Link to="/tokens">
            <button className="bg-primary text-white text-sm font-bold px-5 py-2 rounded-full hover:bg-primary/90 transition-colors shadow-md">
              อัปเกรดเลย 🚀
            </button>
          </Link>
        </div>
      )}

      {/* Recent Placements */}
      {placements.length > 0 && (
        <div>
          <p className="text-sm font-bold text-muted-foreground mb-3">📋 ผลวัดระดับล่าสุด</p>
          <div className="bg-white rounded-3xl border-2 border-purple-100 shadow-sm divide-y divide-purple-50">
            {placements.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold">{p.subject}</p>
                  <p className="text-xs text-muted-foreground">คะแนน {p.score}/10</p>
                </div>
                <span className="text-sm font-bold text-primary bg-purple-50 px-3 py-0.5 rounded-full">Level {p.result_level}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}