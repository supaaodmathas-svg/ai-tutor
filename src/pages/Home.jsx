import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Link, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Crown, Sparkles, Zap, FileText, Star, Gamepad2, Swords, Trophy, Brain,
  ScanText, ArrowRight, Wand2
} from "lucide-react";
import DailyLoginReward from "@/components/DailyLoginReward";
import SavedQuizzes from "@/components/SavedQuizzes";

const subjects = ["คณิตศาสตร์", "วิทยาศาสตร์", "คณิตศาสตร์ 1", "คณิตศาสตร์ 2", "ฟิสิกส์", "เคมี", "ชีววิทยา", "ภาษาอังกฤษ", "ภาษาไทย", "สังคมศึกษา"];

const quickLinks = [
  { to: "/subjects", label: "วัดระดับวิชา", sub: "Placement Test ฟรี", icon: ScanText, tint: "text-indigo-600 bg-indigo-50" },
  { to: "/practice", label: "ฝึกทำข้อสอบ", sub: "AI สร้างข้อสอบให้", icon: Wand2, tint: "text-violet-600 bg-violet-50" },
  { to: "/battle", label: "Quiz Battle", sub: "ท้าเพื่อนแข่งแบบเรียลไทม์", icon: Swords, tint: "text-rose-600 bg-rose-50" },
  { to: "/tournament", label: "Tournament", sub: "แข่งชิงอันดับ", icon: Trophy, tint: "text-amber-600 bg-amber-50" },
  { to: "/learning-twin", label: "AI Learning Twin", sub: "วิเคราะห์พัฒนาการ", icon: Brain, tint: "text-teal-600 bg-teal-50" },
  { to: "/exam-generator", label: "Exam Generator", sub: "สร้างข้อสอบจากไฟล์", icon: FileText, tint: "text-sky-600 bg-sky-50" },
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
    queryKey: ["recent-quizzes", user?.id],
    queryFn: () => base44.entities.Quiz.filter({ completed: true, created_by_id: user?.id }, "-created_date", 5),
    enabled: !!user?.id,
  });

  if (user?.user_type === "teacher") {
    return <Navigate to="/teacher-dashboard" replace />;
  }

  const subjectLevels = user?.subject_levels || {};

  const avgScore = quizzes.length > 0
    ? Math.round(quizzes.reduce((a, q) => a + ((q.score / q.total_questions) * 100), 0) / quizzes.length)
    : null;

  // Calculate average score per subject
  const getSubjectAvgScore = (subject) => {
    const subjectQuizzes = quizzes.filter(q => q.subject === subject);
    if (subjectQuizzes.length === 0) return null;
    return Math.round(subjectQuizzes.reduce((a, q) => a + ((q.score / q.total_questions) * 100), 0) / subjectQuizzes.length);
  };

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
          <div className="absolute top-4 right-5 flex items-center gap-1.5">
            <Crown className="w-5 h-5 text-fuchsia-500" />
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background: "rgba(168,85,247,0.2)", color: "#d8b4fe", border: "1px solid rgba(168,85,247,0.4)"}}>AI Pro</span>
          </div>
        ) : (
          <Sparkles className="absolute top-4 right-5 w-6 h-6 text-primary/40" />
        )}

        <p className="text-sm font-semibold text-muted-foreground mb-1">สวัสดี</p>
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
        <p className="text-sm text-muted-foreground">วันนี้จะเรียนรู้อะไรดี?</p>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(0%); }
          100% { transform: translateX(280%); }
        }
      `}</style>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-2xl p-4 text-center border border-border shadow-sm">
          <div className="flex items-center justify-center gap-1.5">
            <Zap className="w-4 h-4 text-primary" fill="currentColor" />
            <p className="text-2xl font-display font-bold text-primary">{user?.tokens ?? 50}</p>
          </div>
          <p className="text-xs font-semibold text-muted-foreground mt-1">Tokens</p>
        </div>
        <div className="bg-card rounded-2xl p-4 text-center border border-border shadow-sm">
          <div className="flex items-center justify-center gap-1.5">
            <FileText className="w-4 h-4 text-accent" />
            <p className="text-2xl font-display font-bold text-accent">{quizzes.length}</p>
          </div>
          <p className="text-xs font-semibold text-muted-foreground mt-1">ข้อสอบที่ทำ</p>
        </div>
        <div className="bg-card rounded-2xl p-4 text-center border border-border shadow-sm">
          <div className="flex items-center justify-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
            <p className="text-2xl font-display font-bold text-amber-500">{avgScore !== null ? `${avgScore}%` : "—"}</p>
          </div>
          <p className="text-xs font-semibold text-muted-foreground mt-1">คะแนนเฉลี่ย</p>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Gamepad2 className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-bold text-muted-foreground">เมนูหลัก</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map(({ to, label, sub, icon: Icon, tint }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col gap-2 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-150 active:scale-95"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tint}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Subject Levels */}
      {Object.keys(subjectLevels).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-bold text-muted-foreground">เลเวลรายวิชา</p>
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border">
            {subjects.map(s => {
              const lv = subjectLevels[s];
              const subjectAvg = getSubjectAvgScore(s);
              if (!lv) return null;
              return (
                <div key={s} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{s}</span>
                    {subjectAvg !== null && (
                      <p className="text-xs text-muted-foreground">คะแนนเฉลี่ย: {subjectAvg}%</p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-primary bg-secondary px-3 py-1 rounded-full">
                    <Star className="w-3 h-3" fill="currentColor" />
                    Lv.{lv}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Saved Quizzes */}
      <SavedQuizzes />

      {/* AI Pro Upgrade */}
      {!user?.is_premium && (
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{background: "#0f172a", border: "1.5px solid #a855f7", boxShadow: "0 0 24px rgba(168,85,247,0.5), inset 0 0 24px rgba(168,85,247,0.05)"}}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-fuchsia-400" />
            <p className="font-display font-bold text-xl" style={{background: "linear-gradient(90deg, #818cf8, #e879f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>AI Pro</p>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background: "#134e4a", color: "#2dd4bf", border: "1px solid #0d9488"}}>BEST VALUE</span>
          </div>
          <p className="text-center text-sm mb-3" style={{color: "#94a3b8"}}>คำอธิบายละเอียด · แผนเรียนส่วนตัว</p>
          <p className="text-center font-display font-bold text-3xl text-white mb-4">฿109 <span className="text-base font-normal" style={{color: "#94a3b8"}}>/เดือน</span></p>
          <Link to="/tokens">
            <button className="w-full py-3 rounded-xl font-bold text-sm transition-all inline-flex items-center justify-center gap-2" style={{background: "rgba(168,85,247,0.15)", border: "1.5px solid #a855f7", color: "#c084fc", boxShadow: "0 0 12px rgba(168,85,247,0.3)"}}>
              อัปเกรดเลย
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      )}


    </div>
  );
}