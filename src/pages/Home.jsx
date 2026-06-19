import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react";
import DailyLoginReward from "@/components/DailyLoginReward";

const subjects = ["คณิตศาสตร์ 1", "คณิตศาสตร์ 2", "ฟิสิกส์", "เคมี", "ชีววิทยา", "ภาษาอังกฤษ", "ภาษาไทย", "สังคมศึกษา"];

const quickLinks = [
  { to: "/subjects", label: "ทดสอบวัดระดับตัวเอง", sub: "Placement Test ฟรี!", emoji: "📝" },
  { to: "/practice", label: "ฝึกทำข้อสอบ", sub: "AI สร้างข้อสอบให้", emoji: "✏️" },
  { to: "/battle", label: "Quiz Battle", sub: "ท้าเพื่อนแข่ง", emoji: "⚔️" },
  { to: "/tournament", label: "Tournament", sub: "แข่งชิงอันดับ", emoji: "🏆" },
];

export default function Home() {
  const { user } = useAuth();
  const [showDailyReward, setShowDailyReward] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const checkDaily = async () => {
      const records = await base44.entities.DailyLogin.filter({ user_id: user.id });
      const rec = records[0];
      const today = new Date().toISOString().split("T")[0];
      if (!rec || rec.last_login_date !== today) {
        setShowDailyReward(true);
      }
    };
    checkDaily();
  }, [user?.id]);

  const { data: quizzes = [] } = useQuery({
    queryKey: ["recent-quizzes"],
    queryFn: () => base44.entities.Quiz.filter({ completed: true }, "-created_date", 5),
  });

  const subjectLevels = user?.subject_levels || {};

  const avgScore = quizzes.length > 0
    ? Math.round(quizzes.reduce((a, q) => a + ((q.score / q.total_questions) * 100), 0) / quizzes.length)
    : null;

  return (
    <div className="space-y-6 pb-10">
      {showDailyReward && <DailyLoginReward onClose={() => setShowDailyReward(false)} />}

      {/* Hero greeting */}
      <div
        className="bg-card rounded-3xl p-6 relative overflow-hidden"
        style={user?.is_premium ? {
          border: "2px solid #a855f7",
          boxShadow: "0 0 0 1px rgba(168,85,247,0.3), 0 0 24px rgba(168,85,247,0.4), 0 0 60px rgba(168,85,247,0.15)",
          background: "linear-gradient(135deg, hsl(var(--card)) 70%, rgba(168,85,247,0.08))"
        } : { border: "2px solid hsl(var(--border))" }}
      >
        {/* Animated shimmer for Pro */}
        {user?.is_premium && (
          <div className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden">
            <div style={{
              position: "absolute", top: "-50%", left: "-60%",
              width: "60%", height: "200%",
              background: "linear-gradient(105deg, transparent 40%, rgba(168,85,247,0.12) 50%, transparent 60%)",
              animation: "shimmer 3s infinite"
            }} />
          </div>
        )}

        {user?.is_premium ? (
          <div className="absolute top-3 right-4 flex items-center gap-1.5">
            <span className="text-xl">👑</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background: "rgba(168,85,247,0.2)", color: "#d8b4fe", border: "1px solid rgba(168,85,247,0.4)"}}>AI Pro</span>
          </div>
        ) : (
          <div className="absolute top-3 right-4 text-3xl">🌟</div>
        )}

        <p className="text-sm font-semibold text-muted-foreground mb-1">สวัสดี 👋</p>
        <h1
          className="text-2xl font-display font-bold mb-1"
          style={user?.is_premium ? {
            background: "linear-gradient(90deg, #818cf8, #c084fc, #e879f9)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          } : {}}
        >
          {!user?.is_premium && <span className="text-foreground">{user?.full_name || "นักเรียน"}!</span>}
          {user?.is_premium && `${user?.full_name || "นักเรียน"}!`}
        </h1>
        <p className="text-sm text-muted-foreground">วันนี้จะเรียนรู้อะไรดี? 🚀</p>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(0%); }
          100% { transform: translateX(280%); }
        }
      `}</style>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-3xl p-4 text-center border-2 border-border shadow-sm">
          <p className="text-2xl font-display font-bold text-primary">⚡ {user?.tokens ?? 50}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1">Tokens</p>
        </div>
        <div className="bg-card rounded-3xl p-4 text-center border-2 border-border shadow-sm">
          <p className="text-2xl font-display font-bold text-accent">📝 {quizzes.length}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1">ข้อสอบที่ทำ</p>
        </div>
        <div className="bg-card rounded-3xl p-4 text-center border-2 border-border shadow-sm">
          <p className="text-2xl font-display font-bold text-amber-500">⭐ {avgScore !== null ? `${avgScore}%` : "—"}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1">คะแนนเฉลี่ย</p>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <p className="text-sm font-bold text-muted-foreground mb-3">🎮 เมนูหลัก</p>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map(({ to, label, sub, emoji }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col gap-1 p-4 rounded-3xl border-2 border-border bg-card hover:bg-muted transition-all duration-150 active:scale-95"
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
          <div className="bg-card rounded-3xl border-2 border-border shadow-sm divide-y divide-border">
            {subjects.map(s => {
              const lv = subjectLevels[s];
              if (!lv) return null;
              return (
                <div key={s} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm font-semibold text-foreground">{s}</span>
                  <span className="text-sm font-bold text-primary bg-secondary px-3 py-0.5 rounded-full">Lv.{lv} ⭐</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Pro Upgrade */}
      {!user?.is_premium && (
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{background: "#0f172a", border: "1.5px solid #a855f7", boxShadow: "0 0 24px rgba(168,85,247,0.5), inset 0 0 24px rgba(168,85,247,0.05)"}}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <p className="font-display font-bold text-xl" style={{background: "linear-gradient(90deg, #818cf8, #e879f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>🌈 AI Pro</p>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background: "#134e4a", color: "#2dd4bf", border: "1px solid #0d9488"}}>BEST VALUE</span>
          </div>
          <p className="text-center text-sm mb-3" style={{color: "#94a3b8"}}>คำอธิบายละเอียด · แผนเรียนส่วนตัว</p>
          <p className="text-center font-display font-bold text-3xl text-white mb-4">฿109 <span className="text-base font-normal" style={{color: "#94a3b8"}}>/เดือน</span></p>
          <Link to="/tokens">
            <button className="w-full py-3 rounded-xl font-bold text-sm transition-all" style={{background: "rgba(168,85,247,0.15)", border: "1.5px solid #a855f7", color: "#c084fc", boxShadow: "0 0 12px rgba(168,85,247,0.3)"}}>
              อัปเกรดเลย 🚀
            </button>
          </Link>
        </div>
      )}


    </div>
  );
}