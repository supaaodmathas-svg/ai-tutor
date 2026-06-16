import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen, Trophy, Zap, Crown, Swords, FlaskConical,
  TrendingUp, Star, ArrowRight, GraduationCap, Sparkles,
  BrainCircuit, FileText, CalendarCheck, Clock
} from "lucide-react";
import { motion } from "framer-motion";

const subjects = ["คณิตศาสตร์ 1", "คณิตศาสตร์ 2", "ฟิสิกส์", "เคมี", "ชีววิทยา", "ภาษาอังกฤษ", "ภาษาไทย", "สังคมศึกษา"];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

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

  const stats = {
    totalQuizzes: quizzes.length,
    avgScore: quizzes.length > 0
      ? Math.round(quizzes.reduce((a, q) => a + ((q.score / q.total_questions) * 100), 0) / quizzes.length)
      : 0,
    subjectsTested: [...new Set(placements.map(p => p.subject))].length,
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section */}
      <motion.div
        {...fadeIn}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-6 md:p-10 text-white"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-6 h-6" />
            <span className="text-sm font-medium text-white/80">AI Tutor</span>
            {user?.is_premium && (
              <Badge className="bg-amber-400 text-amber-900 text-[10px]">
                <Crown className="w-3 h-3 mr-1" /> PRO
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-4xl font-display font-bold mb-2">
            สวัสดี, {user?.full_name || "นักเรียน"} 👋
          </h1>
          <p className="text-white/70 text-sm md:text-base max-w-lg mb-6">
            พร้อมเรียนรู้วันนี้แล้วหรือยัง? AI จะช่วยออกแบบข้อสอบที่เหมาะกับระดับของคุณ
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/subjects">
              <Button className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg">
                <BookOpen className="w-4 h-4 mr-2" />
                วัดระดับความรู้
              </Button>
            </Link>
            <Link to="/practice">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <FlaskConical className="w-4 h-4 mr-2" />
                ฝึกทำข้อสอบ
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{user?.tokens ?? 50}</p>
              <p className="text-xs text-muted-foreground">Tokens</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{stats.totalQuizzes}</p>
              <p className="text-xs text-muted-foreground">ข้อสอบที่ทำ</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{stats.avgScore}%</p>
              <p className="text-xs text-muted-foreground">คะแนนเฉลี่ย</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{stats.subjectsTested}</p>
              <p className="text-xs text-muted-foreground">วิชาที่ทดสอบ</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Subject Levels */}
      {Object.keys(subjectLevels).length > 0 && (
        <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
          <h2 className="text-lg font-heading font-bold mb-4">เลเวลตามรายวิชา</h2>
          <Card className="p-5 border-0 shadow-md">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {subjects.map(s => {
                const lv = subjectLevels[s];
                if (!lv) return null;
                return (
                  <div key={s} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-secondary/60 to-secondary/20">
                    <span className="text-sm font-medium truncate">{s}</span>
                    <Badge variant="secondary" className="flex-shrink-0">Lv.{lv}</Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {/* AI Pro Promotion */}
      {!user?.is_premium && (
        <motion.div {...fadeIn} transition={{ delay: 0.18 }}>
          <Card className="p-0 border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-200/20 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-display font-bold text-amber-900">AI Pro</h3>
                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs">พรีเมียม</Badge>
                  </div>
                  <p className="text-sm text-amber-700">ยกระดับการเรียนด้วย AI ระดับโปร</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                {[
                  { icon: BrainCircuit, text: "AI ตอบเร็วกว่า 3 เท่า" },
                  { icon: FileText, text: "คำอธิบายละเอียดแม่นยำ" },
                  { icon: TrendingUp, text: "ข้อสอบขั้นสูงเฉพาะตัว" },
                  { icon: Sparkles, text: "วิเคราะห์เชิงลึก" },
                  { icon: CalendarCheck, text: "แผนเรียนส่วนตัวรายสัปดาห์" },
                  { icon: FileText, text: "รายงานความก้าวหน้า" },
                  { icon: Clock, text: "ตอบลำดับความสำคัญสูงสุด" },
                  { icon: Zap, text: "แถม 200 Tokens" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-amber-800">
                    <item.icon className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between bg-white/60 rounded-2xl p-4 gap-4">
                <div>
                  <p className="text-3xl font-display font-black text-amber-900">฿109<span className="text-sm font-normal text-amber-600"> /เดือน</span></p>
                </div>
                <Link to="/tokens">
                  <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all">
                    <Crown className="w-4 h-4 mr-2" />
                    อัปเกรดเป็น AI Pro
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
        <h2 className="text-lg font-heading font-bold mb-4">เริ่มต้นเลย</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/subjects">
            <Card className="p-5 border-0 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">วัดระดับความรู้</h3>
                    <p className="text-xs text-muted-foreground">Placement Test ฟรี!</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Card>
          </Link>

          <Link to="/battle">
            <Card className="p-5 border-0 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <Swords className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Quiz Battle</h3>
                    <p className="text-xs text-muted-foreground">ท้าเพื่อนแข่ง</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Card>
          </Link>

          <Link to="/tournament">
            <Card className="p-5 border-0 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Tournament</h3>
                    <p className="text-xs text-muted-foreground">แข่งชิงอันดับ</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Card>
          </Link>
        </div>
      </motion.div>

      {/* Recent Activity */}
      {placements.length > 0 && (
        <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
          <h2 className="text-lg font-heading font-bold mb-4">ผลวัดระดับล่าสุด</h2>
          <div className="space-y-3">
            {placements.slice(0, 3).map((p) => (
              <Card key={p.id} className="p-4 border-0 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                    📚
                  </div>
                  <div>
                    <p className="font-medium text-sm">{p.subject}</p>
                    <p className="text-xs text-muted-foreground">คะแนน {p.score}/10</p>
                  </div>
                </div>
                <Badge variant="secondary">Level {p.result_level}</Badge>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}