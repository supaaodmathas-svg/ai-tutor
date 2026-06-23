import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Zap, TrendingUp, TrendingDown, Brain, Star, AlertTriangle, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";

const SUBJECTS = ["คณิตศาสตร์ 1", "คณิตศาสตร์ 2", "ฟิสิกส์", "เคมี", "ชีววิทยา", "ภาษาอังกฤษ", "ภาษาไทย", "สังคมศึกษา"];

function TwinAvatar({ name, consistency }) {
  const level = consistency >= 80 ? "🌟" : consistency >= 50 ? "⚡" : "🌱";
  const statusColor = consistency >= 80 ? "from-purple-500 to-indigo-600" : consistency >= 50 ? "from-primary to-accent" : "from-slate-400 to-slate-600";
  return (
    <div className="flex items-center gap-4">
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${statusColor} flex items-center justify-center shadow-lg text-2xl flex-shrink-0`}>
        {level}
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">My Learning Twin</p>
        <h2 className="text-xl font-display font-bold">{name || "นักเรียน"}'s Twin</h2>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: `${consistency}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{consistency}% ความสม่ำเสมอ</span>
        </div>
      </div>
    </div>
  );
}

function DNACard({ items }) {
  const icons = ["🧠", "📚", "🎯", "⚡", "🔍", "💡", "🔄", "📝"];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((trait, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
          className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/50">
          <span className="text-lg flex-shrink-0">{icons[i % icons.length]}</span>
          <p className="text-sm text-foreground font-medium">{trait}</p>
        </motion.div>
      ))}
    </div>
  );
}

function InsightCard({ insight, index }) {
  const isPositive = /เพิ่มขึ้น|พัฒนา|ดีขึ้น|เก่ง|แข็งแกร่ง|ผ่าน/i.test(insight);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${isPositive ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900" : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900"}`}>
      <span className="text-lg flex-shrink-0">{isPositive ? "📈" : "⚠️"}</span>
      <p className="text-sm text-foreground">{insight}</p>
    </motion.div>
  );
}

function SimulationPanel({ subjectStats, onSimulate, simResult, simLoading }) {
  const [chosenSubject, setChosenSubject] = useState(subjectStats?.[0]?.subject || "");
  const [action, setAction] = useState("practice_more");
  const actionLabels = {
    practice_more: "ฝึกเพิ่มหัวข้อนี้ต่อเนื่อง",
    neglect: "ละเลยหัวข้อนี้",
    intensive: "เรียนแบบเข้มข้น 2 สัปดาห์",
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">เลือกหัวข้อและสถานการณ์เพื่อดูผลกระทบต่อโปรไฟล์การเรียนรู้</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">วิชา</label>
          <select value={chosenSubject} onChange={e => setChosenSubject(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
            {subjectStats.map(s => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">สถานการณ์</label>
          <select value={action} onChange={e => setAction(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
            {Object.entries(actionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <Button onClick={() => onSimulate(chosenSubject, action)} disabled={simLoading} className="w-full">
        {simLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />กำลังจำลอง...</> : <><Zap className="w-4 h-4 mr-2" />จำลองอนาคต</>}
      </Button>
      {simResult && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 space-y-3">
          <p className="text-sm font-bold text-primary">🔮 ผลจำลองอนาคต: {chosenSubject}</p>
          <p className="text-sm text-foreground">{simResult.prediction}</p>
          {simResult.projected_accuracy && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">ความแม่นยำที่คาดการณ์</span>
              <span className="font-bold text-primary">{simResult.projected_accuracy}%</span>
            </div>
          )}
          {simResult.tips?.map((t, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <ChevronRight className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <span>{t}</span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default function LearningTwin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  const { data: twin, isLoading: twinLoading } = useQuery({
    queryKey: ["learning-twin", user?.id],
    queryFn: async () => {
      const list = await base44.entities.LearningTwin.filter({ user_id: user.id });
      return list[0] || null;
    },
    enabled: !!user?.id,
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ["all-quizzes-twin", user?.id],
    queryFn: () => base44.entities.Quiz.filter({ completed: true, created_by_id: user?.id }, "-created_date", 100),
    enabled: !!user?.id,
  });

  const { data: placements = [] } = useQuery({
    queryKey: ["placements-twin", user?.id],
    queryFn: () => base44.entities.PlacementTest.filter({ completed: true, created_by_id: user?.id }),
    enabled: !!user?.id,
  });

  const buildAndSaveTwin = async () => {
    if (quizzes.length === 0) return;
    setGenerating(true);

    // Build subject stats from quiz history
    const subjectMap = {};
    quizzes.forEach(q => {
      if (!q.subject) return;
      if (!subjectMap[q.subject]) subjectMap[q.subject] = { quizCount: 0, scores: [], wrongQuestions: [] };
      const acc = Math.round((q.score / q.total_questions) * 100);
      subjectMap[q.subject].quizCount++;
      subjectMap[q.subject].scores.push(acc);
      if (q.questions && q.user_answers) {
        q.questions.forEach((ques, i) => {
          if (q.user_answers[i] !== ques.correct_answer) {
            subjectMap[q.subject].wrongQuestions.push(ques.question?.slice(0, 60));
          }
        });
      }
    });

    const subjectStats = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      accuracy_history: data.scores,
      latest_accuracy: data.scores[data.scores.length - 1] || 0,
      quiz_count: data.quizCount,
      wrong_topics: [...new Set(data.wrongQuestions)].slice(0, 5),
    }));

    const overallAcc = quizzes.length > 0
      ? Math.round(quizzes.reduce((a, q) => a + (q.score / q.total_questions) * 100, 0) / quizzes.length)
      : 0;

    // Calculate consistency (days with quizzes)
    const quizDates = [...new Set(quizzes.map(q => q.created_date?.split("T")[0]))];
    const consistencyScore = Math.min(100, Math.round((quizDates.length / 30) * 100));

    // Find fastest/slowest improving
    const improving = subjectStats.filter(s => s.accuracy_history.length >= 2)
      .map(s => {
        const first = s.accuracy_history[0];
        const last = s.accuracy_history[s.accuracy_history.length - 1];
        return { subject: s.subject, delta: last - first };
      }).sort((a, b) => b.delta - a.delta);

    const fastestImproving = improving[0]?.subject || "";
    const slowestImproving = improving[improving.length - 1]?.subject || "";

    // Ask AI to build the Learning DNA + strengths/weaknesses/insights
    const summaryData = subjectStats.map(s =>
      `${s.subject}: ${s.quiz_count} ครั้ง, แม่นยำเฉลี่ย ${Math.round(s.accuracy_history.reduce((a,b)=>a+b,0)/Math.max(1,s.accuracy_history.length))}%, ข้อที่มักผิด: ${s.wrong_topics.slice(0,3).join(", ")}`
    ).join("\n");

    const placementSummary = placements.map(p => `${p.subject}: Level ${p.result_level}`).join(", ");

    const aiRes = await base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      prompt: `วิเคราะห์โปรไฟล์การเรียนรู้ของนักเรียน จากข้อมูลต่อไปนี้:

ผลสอบวัดระดับ: ${placementSummary || "ยังไม่มี"}
ประวัติการทำแบบฝึกหัด:
${summaryData || "ยังไม่มี"}
จำนวนวันที่มีกิจกรรม: ${quizDates.length} วัน
ความแม่นยำโดยรวม: ${overallAcc}%

สรุปออกมาเป็น:
1. learning_dna: 4-6 ข้อ สรุปลักษณะการเรียนรู้ของนักเรียนคนนี้
2. strengths: 3 จุดแข็ง
3. weaknesses: 3 จุดอ่อน
4. insights: 3-5 ข้อความ insight เฉพาะตัว (เช่น "นักเรียนมีพัฒนาการด้านฟิสิกส์เพิ่มขึ้น 20%")

ตอบเป็นภาษาไทย กระชับ เข้าใจง่าย`,
      response_json_schema: {
        type: "object",
        properties: {
          learning_dna: { type: "array", items: { type: "string" } },
          strengths: { type: "array", items: { type: "string" } },
          weaknesses: { type: "array", items: { type: "string" } },
          insights: { type: "array", items: { type: "string" } },
        }
      }
    });

    const payload = {
      user_id: user.id,
      last_updated: new Date().toISOString(),
      total_quizzes: quizzes.length,
      total_questions_answered: quizzes.reduce((a, q) => a + (q.total_questions || 0), 0),
      overall_accuracy: overallAcc,
      subject_stats: subjectStats,
      learning_dna: aiRes.learning_dna || [],
      strengths: aiRes.strengths || [],
      weaknesses: aiRes.weaknesses || [],
      insights: aiRes.insights || [],
      fastest_improving: fastestImproving,
      slowest_improving: slowestImproving,
      consistency_score: consistencyScore,
    };

    const existing = await base44.entities.LearningTwin.filter({ user_id: user.id });
    if (existing[0]) {
      await base44.entities.LearningTwin.update(existing[0].id, payload);
    } else {
      await base44.entities.LearningTwin.create(payload);
    }

    queryClient.invalidateQueries({ queryKey: ["learning-twin", user?.id] });
    setGenerating(false);
  };

  const handleSimulate = async (subject, action) => {
    setSimLoading(true);
    setSimResult(null);
    const subjectStat = twin?.subject_stats?.find(s => s.subject === subject);
    const currentAcc = subjectStat?.latest_accuracy || 50;
    const actionText = { practice_more: "ฝึกหัดหัวข้อนี้ต่อเนื่อง", neglect: "ละเลยหัวข้อนี้ไม่ทำแบบฝึก", intensive: "เรียนแบบเข้มข้น 2 สัปดาห์" }[action];
    const res = await base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      prompt: `นักเรียนมีความแม่นยำในวิชา ${subject} อยู่ที่ ${currentAcc}% ปัจจุบัน
หากนักเรียน${actionText} ในช่วง 2-4 สัปดาห์ข้างหน้า
จงทำนายผลกระทบและแนะนำแผนการเรียน ตอบภาษาไทย`,
      response_json_schema: {
        type: "object",
        properties: {
          prediction: { type: "string" },
          projected_accuracy: { type: "number" },
          tips: { type: "array", items: { type: "string" } }
        }
      }
    });
    setSimResult(res);
    setSimLoading(false);
  };

  // Radar chart data
  const radarData = (twin?.subject_stats || []).slice(0, 6).map(s => ({
    subject: s.subject.replace("คณิตศาสตร์ ", "คณิต").slice(0, 6),
    accuracy: s.latest_accuracy || 0,
  }));

  // Trend chart (last 10 quizzes overall)
  const trendData = quizzes.slice(0, 10).reverse().map((q, i) => ({
    name: `#${i + 1}`,
    score: Math.round((q.score / q.total_questions) * 100),
  }));

  if (twinLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  const hasTwin = !!twin;
  const noData = quizzes.length === 0;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/40 dark:via-card dark:to-purple-950/40">
          {hasTwin ? (
            <div className="space-y-4">
              <TwinAvatar name={user?.full_name} consistency={twin.consistency_score || 0} />
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="text-center p-3 bg-white/70 dark:bg-white/5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                  <p className="text-xl font-bold text-primary">{twin.total_quizzes}</p>
                  <p className="text-xs text-muted-foreground">ข้อสอบทั้งหมด</p>
                </div>
                <div className="text-center p-3 bg-white/70 dark:bg-white/5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                  <p className="text-xl font-bold text-accent">{twin.overall_accuracy}%</p>
                  <p className="text-xs text-muted-foreground">ความแม่นยำ</p>
                </div>
                <div className="text-center p-3 bg-white/70 dark:bg-white/5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                  <p className="text-xl font-bold text-amber-500">{twin.consistency_score}%</p>
                  <p className="text-xs text-muted-foreground">สม่ำเสมอ</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">อัปเดตล่าสุด: {twin.last_updated ? new Date(twin.last_updated).toLocaleDateString("th-TH") : "—"}</p>
                <Button size="sm" variant="outline" onClick={buildAndSaveTwin} disabled={generating}>
                  {generating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                  อัปเดต Twin
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-4xl shadow-lg">🤖</div>
              <div>
                <h2 className="text-xl font-display font-bold">My Learning Twin</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {noData ? "ทำแบบฝึกหัดก่อนเพื่อสร้าง Learning Twin ของคุณ" : "สร้าง AI Twin ที่จดจำและวิเคราะห์การเรียนรู้ของคุณ"}
                </p>
              </div>
              {!noData && (
                <Button onClick={buildAndSaveTwin} disabled={generating} className="px-6">
                  {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />กำลังสร้าง Twin...</> : <>✨ สร้าง Learning Twin</>}
                </Button>
              )}
            </div>
          )}
        </Card>
      </motion.div>

      {hasTwin && (
        <>
          {/* Learning DNA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-6 border-0 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold">🧬 Learning DNA</h3>
                  <p className="text-xs text-muted-foreground">ลักษณะการเรียนรู้เฉพาะตัวของคุณ</p>
                </div>
              </div>
              <DNACard items={twin.learning_dna || []} />
            </Card>
          </motion.div>

          {/* Strengths & Weaknesses */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5 border-0 shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <h3 className="font-bold text-sm">จุดแข็ง</h3>
                </div>
                <div className="space-y-2">
                  {(twin.strengths || []).map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 font-bold mt-0.5">✓</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
                {twin.fastest_improving && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">พัฒนาเร็วที่สุด</p>
                    <p className="text-sm font-semibold text-green-600">{twin.fastest_improving}</p>
                  </div>
                )}
              </Card>
              <Card className="p-5 border-0 shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <h3 className="font-bold text-sm">จุดอ่อน</h3>
                </div>
                <div className="space-y-2">
                  {(twin.weaknesses || []).map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-red-400 font-bold mt-0.5">!</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
                {twin.slowest_improving && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">พัฒนาช้าที่สุด</p>
                    <p className="text-sm font-semibold text-red-500">{twin.slowest_improving}</p>
                  </div>
                )}
              </Card>
            </div>
          </motion.div>

          {/* Insights */}
          {(twin.insights || []).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6 border-0 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-amber-500" />
                  <h3 className="font-display font-bold">💡 Insights จาก Twin</h3>
                </div>
                <div className="space-y-3">
                  {twin.insights.map((ins, i) => <InsightCard key={i} insight={ins} index={i} />)}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Radar Chart */}
          {radarData.length > 2 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="p-6 border-0 shadow-md">
                <h3 className="font-display font-bold mb-4">📡 รายวิชา (Radar)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <Radar name="ความแม่นยำ" dataKey="accuracy" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>
          )}

          {/* Score Trend */}
          {trendData.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6 border-0 shadow-md">
                <h3 className="font-display font-bold mb-4">📈 แนวโน้มคะแนน (10 ครั้งล่าสุด)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v}%`, "คะแนน"]} />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>
          )}

          {/* Subject Accuracy Bar */}
          {(twin.subject_stats || []).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card className="p-6 border-0 shadow-md">
                <h3 className="font-display font-bold mb-4">📊 ความแม่นยำรายวิชา</h3>
                <div className="space-y-3">
                  {twin.subject_stats.map(s => (
                    <div key={s.subject}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{s.subject}</span>
                        <span className="text-muted-foreground">{s.latest_accuracy}%</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${s.latest_accuracy}%` }} transition={{ duration: 0.8, delay: 0.4 }}
                          className={`h-full rounded-full ${s.latest_accuracy >= 70 ? "bg-green-500" : s.latest_accuracy >= 50 ? "bg-primary" : "bg-red-400"}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Future Simulation */}
          {(twin.subject_stats || []).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-6 border-0 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold">🔮 Future Learning Simulation</h3>
                    <p className="text-xs text-muted-foreground">จำลองผลกระทบต่อโปรไฟล์การเรียนรู้</p>
                  </div>
                </div>
                <SimulationPanel
                  subjectStats={twin.subject_stats}
                  onSimulate={handleSimulate}
                  simResult={simResult}
                  simLoading={simLoading}
                />
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}