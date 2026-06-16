import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import QuizQuestion from "@/components/QuizQuestion";
import { Trophy, Users, Loader2, CheckCircle, Clock, Medal, Swords, Zap, ArrowLeft, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { format, formatDistanceToNow } from "date-fns";

export default function TournamentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTournament, setActiveTournament] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 20),
  });

  const joinTournament = async (tournament) => {
    if ((user?.tokens ?? 0) < 10) {
      toast({ title: "⚠️ Token ไม่เพียงพอ", description: "ต้องใช้ 10 Tokens กรุณาเติม Token ก่อน", variant: "destructive" });
      setTimeout(() => { window.location.href = "/tokens"; }, 2000);
      return;
    }
    const alreadyJoined = tournament.participants?.some(p => p.user_id === user.id);
    if (alreadyJoined) {
      const myP = tournament.participants.find(p => p.user_id === user.id);
      if (myP?.completed) {
        setResult({ tournament, myScore: myP.score });
        return;
      }
      setActiveTournament(tournament);
      setAnswers(new Array(tournament.questions.length).fill(-1));
      setCurrentIndex(0);
      return;
    }
    const updatedParticipants = [...(tournament.participants || []), { user_id: user.id, user_name: user.full_name, score: 0, completed: false }];
    await base44.entities.Tournament.update(tournament.id, { participants: updatedParticipants });
    await base44.auth.updateMe({ tokens: (user?.tokens ?? 0) - 10 });
    queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    setActiveTournament({ ...tournament, participants: updatedParticipants });
    setAnswers(new Array(tournament.questions.length).fill(-1));
    setCurrentIndex(0);
  };

  const handleAnswer = (answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answerIndex;
    setAnswers(newAnswers);
    if (currentIndex < activeTournament.questions.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    }
  };

  const submitTournament = async () => {
    const score = activeTournament.questions.reduce(
      (acc, q, i) => acc + (answers[i] === q.correct_answer ? 1 : 0), 0
    );
    const updatedParticipants = activeTournament.participants.map(p =>
      p.user_id === user.id ? { ...p, score, completed: true } : p
    );
    await base44.entities.Tournament.update(activeTournament.id, { participants: updatedParticipants });
    queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    setResult({ tournament: activeTournament, myScore: score });
    setActiveTournament(null);
  };

  if (activeTournament) {
    const q = activeTournament.questions;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => { setActiveTournament(null); setAnswers([]); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> ออก
          </button>
          <Badge variant="outline" className="text-xs">{currentIndex + 1}/{q.length}</Badge>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold">{activeTournament.title}</h1>
            <p className="text-xs text-muted-foreground">{activeTournament.subject}</p>
          </div>
        </div>

        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / q.length) * 100}%` }} />
        </div>

        <QuizQuestion
          question={q[currentIndex]}
          index={currentIndex}
          total={q.length}
          selectedAnswer={answers[currentIndex]}
          onAnswer={handleAnswer}
        />

        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
            ← ก่อนหน้า
          </Button>
          <div className="flex gap-1.5">
            {q.map((_, i) => (
              <button key={i} onClick={() => setCurrentIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentIndex ? "bg-primary scale-125" : answers[i] !== -1 ? "bg-primary/40" : "bg-muted"
                }`} />
            ))}
          </div>
          {currentIndex < q.length - 1 ? (
            <Button onClick={() => setCurrentIndex(currentIndex + 1)}>ถัดไป →</Button>
          ) : (
            <Button onClick={submitTournament} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <CheckCircle className="w-4 h-4 mr-2" /> ส่งคำตอบ
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (result) {
    const sorted = [...(result.tournament.participants || [])].filter(p => p.completed).sort((a, b) => b.score - a.score);
    const myRank = sorted.findIndex(p => p.user_id === user?.id) + 1;
    const medals = ["🥇", "🥈", "🥉"];
    return (
      <div className="max-w-lg mx-auto">
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-8 border-0 shadow-xl text-center overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
              <Trophy className="w-20 h-20 text-amber-500 mx-auto mb-4" />
              <h1 className="text-2xl font-display font-bold mb-1">{result.tournament.title}</h1>
              <p className="text-sm text-muted-foreground mb-6">{result.tournament.subject}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-secondary/50 rounded-2xl p-4">
                  <p className="text-3xl font-display font-black text-primary">{result.myScore}</p>
                  <p className="text-xs text-muted-foreground">คะแนนของคุณ</p>
                </div>
                <div className="bg-secondary/50 rounded-2xl p-4">
                  <p className="text-3xl font-display font-black text-amber-600">#{myRank || "?"}</p>
                  <p className="text-xs text-muted-foreground">อันดับของคุณ</p>
                </div>
              </div>

              <div className="space-y-2 text-left mb-6">
                <h3 className="font-semibold text-sm flex items-center gap-2"><Medal className="w-4 h-4 text-amber-500" /> อันดับผู้เข้าแข่งขัน</h3>
                {sorted.map((p, i) => (
                  <div key={p.user_id}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      p.user_id === user?.id ? "bg-primary/10 border border-primary/20" : "bg-secondary/30"
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg w-7 text-center">{medals[i] || `${i+1}.`}</span>
                      <span className="font-medium text-sm">{p.user_name}</span>
                      {p.user_id === user?.id && <Badge className="text-[10px]">คุณ</Badge>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{p.score} คะแนน</span>
                      {i === 0 && <Crown className="w-4 h-4 text-amber-500" />}
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={() => setResult(null)} className="w-full" variant="outline">← กลับไปรายการ Tournament</Button>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Tournament</h1>
            <p className="text-sm text-muted-foreground">แข่งขันชิงอันดับ — ใช้ 10 Tokens ต่อครั้ง</p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : tournaments.length === 0 ? (
        <Card className="p-12 border-0 shadow-sm text-center">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">ยังไม่มี Tournament ตอนนี้</p>
          <p className="text-xs text-muted-foreground mt-1">กรุณารอผู้ดูแลระบบสร้าง Tournament</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tournaments.map((t, idx) => {
            const joined = t.participants?.some(p => p.user_id === user?.id);
            const completed = t.participants?.find(p => p.user_id === user?.id)?.completed;
            const participantCount = t.participants?.length || 0;
            const statusColors = {
              active: { bg: "from-green-500/10 to-emerald-500/5", border: "border-green-200", badge: "default" },
              upcoming: { bg: "from-blue-500/10 to-indigo-500/5", border: "border-blue-200", badge: "secondary" },
              completed: { bg: "from-muted/50 to-muted/30", border: "border-border", badge: "secondary" },
            };
            const sc = statusColors[t.status || "upcoming"];

            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
                <Card className={`p-5 border-2 ${sc.border} shadow-md hover:shadow-lg transition-all bg-gradient-to-br ${sc.bg}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-heading font-semibold">{t.title}</h3>
                      <p className="text-xs text-muted-foreground">{t.subject} • {t.questions?.length || 0} ข้อ</p>
                    </div>
                    <Badge variant={sc.badge}>
                      {t.status === "active" ? "🔥 กำลังแข่ง" : t.status === "upcoming" ? "⏳ เร็วๆ นี้" : "✅ เสร็จสิ้น"}
                    </Badge>
                  </div>

                  {t.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{t.description}</p>}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {participantCount}/{t.max_participants} คน</span>
                    {t.start_date && (
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />
                        {t.status === "completed" ? format(new Date(t.start_date), "d MMM") : formatDistanceToNow(new Date(t.start_date), { addSuffix: true })}
                      </span>
                    )}
                  </div>

                  {/* Leaderboard Preview */}
                  {t.participants?.filter(p => p.completed).length > 0 && (
                    <div className="mb-4 space-y-1">
                      {t.participants.filter(p => p.completed).sort((a, b) => b.score - a.score).slice(0, 3).map((p, i) => (
                        <div key={p.user_id} className="flex items-center gap-2 text-xs">
                          <span>{["🥇","🥈","🥉"][i]}</span>
                          <span className="text-muted-foreground truncate flex-1">{p.user_name}</span>
                          <Badge variant="outline" className="text-[10px]">{p.score}</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    onClick={() => joinTournament(t)}
                    disabled={t.status !== "active"}
                    className="w-full"
                    variant={joined && !completed ? "outline" : "default"}
                  >
                    {completed ? (
                      <><Medal className="w-4 h-4 mr-2" /> ดูผลลัพธ์</>
                    ) : joined ? (
                      <><Swords className="w-4 h-4 mr-2" /> ทำข้อสอบต่อ</>
                    ) : (
                      <><Zap className="w-4 h-4 mr-2" /> เข้าร่วม (10 Tokens)</>
                    )}
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}