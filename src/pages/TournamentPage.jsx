import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import QuizQuestion from "@/components/QuizQuestion";
import { Trophy, Users, Loader2, CheckCircle, Clock, Medal } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

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
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-amber-500" />
          <h1 className="text-xl font-display font-bold">{activeTournament.title}</h1>
        </div>
        <QuizQuestion
          question={activeTournament.questions[currentIndex]}
          index={currentIndex}
          total={activeTournament.questions.length}
          selectedAnswer={answers[currentIndex]}
          onAnswer={handleAnswer}
        />
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
            ← ก่อนหน้า
          </Button>
          {currentIndex < activeTournament.questions.length - 1 ? (
            <Button onClick={() => setCurrentIndex(currentIndex + 1)}>ถัดไป →</Button>
          ) : (
            <Button onClick={submitTournament} disabled={answers.includes(-1)} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
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
    return (
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-8 border-0 shadow-xl text-center">
            <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-display font-bold mb-2">{result.tournament.title}</h1>
            <p className="text-4xl font-display font-bold text-primary mb-1">
              {result.myScore}/{result.tournament.questions.length}
            </p>
            <p className="text-muted-foreground mb-6">อันดับที่ {myRank || "?"}</p>
            <div className="space-y-2 text-left mb-6">
              <h3 className="font-semibold text-sm">🏆 อันดับ</h3>
              {sorted.map((p, i) => (
                <div key={p.user_id} className={`flex items-center justify-between p-3 rounded-xl ${p.user_id === user?.id ? "bg-primary/10" : "bg-secondary/50"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`}</span>
                    <span className="font-medium text-sm">{p.user_name}</span>
                  </div>
                  <Badge variant="secondary">{p.score} คะแนน</Badge>
                </div>
              ))}
            </div>
            <Button onClick={() => setResult(null)} className="w-full">กลับ</Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Tournament</h1>
          <p className="text-sm text-muted-foreground">แข่งขันชิงอันดับ (ใช้ 10 Tokens)</p>
        </div>
      </div>

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
          {tournaments.map(t => {
            const joined = t.participants?.some(p => p.user_id === user?.id);
            const completed = t.participants?.find(p => p.user_id === user?.id)?.completed;
            return (
              <Card key={t.id} className="p-5 border-0 shadow-md">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-heading font-semibold">{t.title}</h3>
                    <p className="text-xs text-muted-foreground">{t.subject}</p>
                  </div>
                  <Badge variant={t.status === "active" ? "default" : "secondary"}>
                    {t.status === "active" ? "กำลังแข่ง" : t.status === "upcoming" ? "เร็วๆ นี้" : "เสร็จสิ้น"}
                  </Badge>
                </div>
                {t.description && <p className="text-sm text-muted-foreground mb-3">{t.description}</p>}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {t.participants?.length || 0}/{t.max_participants}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t.questions?.length || 0} ข้อ</span>
                </div>
                <Button
                  onClick={() => joinTournament(t)}
                  disabled={t.status !== "active"}
                  className="w-full"
                  variant={joined ? "outline" : "default"}
                >
                  {completed ? "ดูผลลัพธ์" : joined ? "ทำข้อสอบต่อ" : "เข้าร่วม (10 Tokens)"}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}