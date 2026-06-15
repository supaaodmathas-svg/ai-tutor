import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import QuizQuestion from "@/components/QuizQuestion";
import { Swords, Loader2, Trophy, CheckCircle, Users, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const subjects = ["คณิตศาสตร์ 1", "คณิตศาสตร์ 2", "ฟิสิกส์", "เคมี", "ชีววิทยา", "ภาษาอังกฤษ", "ภาษาไทย", "สังคมศึกษา"];

export default function Battle() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [activeBattle, setActiveBattle] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [battleResult, setBattleResult] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: battles = [], isLoading } = useQuery({
    queryKey: ["battles"],
    queryFn: () => base44.entities.QuizBattle.list("-created_date", 20),
  });

  const myBattles = battles.filter(
    b => b.challenger_id === user?.id || b.opponent_id === user?.id
  );
  const pendingBattles = battles.filter(
    b => b.status === "pending" && b.challenger_id !== user?.id && !b.opponent_id
  );

  const createBattle = async () => {
    if (!subject) return;
    if ((user?.tokens ?? 50) < 2) {
      toast({ title: "Token ไม่เพียงพอ", description: "ต้องใช้ 2 Tokens", variant: "destructive" });
      return;
    }
    setCreating(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `สร้างข้อสอบแข่งขันวิชา ${subject} จำนวน 5 ข้อ ระดับปานกลาง-ยาก สำหรับมัธยมปลาย ภาษาไทย แต่ละข้อมี 4 ตัวเลือก`,
      response_json_schema: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                level: { type: "number" },
                question: { type: "string" },
                choices: { type: "array", items: { type: "string" } },
                correct_answer: { type: "number" }
              }
            }
          }
        }
      },
      add_context_from_internet: true,
    });

    await base44.entities.QuizBattle.create({
      subject,
      challenger_id: user.id,
      challenger_name: user.full_name,
      questions: res.questions,
      status: "pending",
    });
    await base44.auth.updateMe({ tokens: (user?.tokens ?? 50) - 2 });
    queryClient.invalidateQueries({ queryKey: ["battles"] });
    setCreating(false);
    setDialogOpen(false);
    toast({ title: "สร้าง Battle สำเร็จ!", description: "รอคู่แข่งเข้าร่วม" });
  };

  const joinBattle = async (battle) => {
    if ((user?.tokens ?? 50) < 2) {
      toast({ title: "Token ไม่เพียงพอ", variant: "destructive" });
      return;
    }
    await base44.entities.QuizBattle.update(battle.id, {
      opponent_id: user.id,
      opponent_name: user.full_name,
      status: "in_progress",
    });
    await base44.auth.updateMe({ tokens: (user?.tokens ?? 50) - 2 });
    setActiveBattle({ ...battle, opponent_id: user.id, opponent_name: user.full_name, status: "in_progress" });
    setAnswers(new Array(battle.questions.length).fill(-1));
    setCurrentIndex(0);
  };

  const playBattle = (battle) => {
    const isChallenger = battle.challenger_id === user?.id;
    const alreadyPlayed = isChallenger ? battle.challenger_answers?.length > 0 : battle.opponent_answers?.length > 0;
    if (alreadyPlayed) {
      setBattleResult(battle);
      return;
    }
    setActiveBattle(battle);
    setAnswers(new Array(battle.questions.length).fill(-1));
    setCurrentIndex(0);
  };

  const handleAnswer = (answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answerIndex;
    setAnswers(newAnswers);
    if (currentIndex < activeBattle.questions.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    }
  };

  const submitBattle = async () => {
    const score = activeBattle.questions.reduce(
      (acc, q, i) => acc + (answers[i] === q.correct_answer ? 1 : 0), 0
    );
    const isChallenger = activeBattle.challenger_id === user?.id;
    const update = isChallenger
      ? { challenger_answers: answers, challenger_score: score }
      : { opponent_answers: answers, opponent_score: score };

    const otherAnswered = isChallenger
      ? activeBattle.opponent_answers?.length > 0
      : activeBattle.challenger_answers?.length > 0;

    if (otherAnswered) {
      const otherScore = isChallenger ? activeBattle.opponent_score : activeBattle.challenger_score;
      const winnerId = score > otherScore
        ? user.id
        : score < otherScore
        ? (isChallenger ? activeBattle.opponent_id : activeBattle.challenger_id)
        : "draw";
      update.status = "completed";
      update.winner_id = winnerId;
    }

    await base44.entities.QuizBattle.update(activeBattle.id, update);
    queryClient.invalidateQueries({ queryKey: ["battles"] });
    setBattleResult({ ...activeBattle, ...update });
    setActiveBattle(null);
  };

  if (activeBattle) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Swords className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-display font-bold">Quiz Battle - {activeBattle.subject}</h1>
        </div>
        <QuizQuestion
          question={activeBattle.questions[currentIndex]}
          index={currentIndex}
          total={activeBattle.questions.length}
          selectedAnswer={answers[currentIndex]}
          onAnswer={handleAnswer}
        />
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
            ← ก่อนหน้า
          </Button>
          {currentIndex < activeBattle.questions.length - 1 ? (
            <Button onClick={() => setCurrentIndex(currentIndex + 1)}>ถัดไป →</Button>
          ) : (
            <Button onClick={submitBattle} disabled={answers.includes(-1)} className="bg-gradient-to-r from-primary to-accent">
              <CheckCircle className="w-4 h-4 mr-2" /> ส่งคำตอบ
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (battleResult) {
    const isChallenger = battleResult.challenger_id === user?.id;
    const myScore = isChallenger ? battleResult.challenger_score : battleResult.opponent_score;
    const opponentScore = isChallenger ? battleResult.opponent_score : battleResult.challenger_score;
    const opponentName = isChallenger ? battleResult.opponent_name : battleResult.challenger_name;
    const isWinner = battleResult.winner_id === user?.id;
    const isDraw = battleResult.winner_id === "draw";

    return (
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-8 border-0 shadow-xl text-center">
            <Trophy className={`w-16 h-16 mx-auto mb-4 ${isWinner ? "text-amber-500" : isDraw ? "text-blue-500" : "text-muted-foreground"}`} />
            <h1 className="text-2xl font-display font-bold mb-2">
              {battleResult.status === "completed"
                ? isWinner ? "🎉 คุณชนะ!" : isDraw ? "🤝 เสมอ!" : "😢 แพ้ไปนิดเดียว"
                : "⏳ รอคู่แข่งทำข้อสอบ"}
            </h1>
            <div className="flex justify-center gap-8 my-6">
              <div>
                <p className="text-3xl font-bold text-primary">{myScore ?? "?"}</p>
                <p className="text-xs text-muted-foreground">คุณ</p>
              </div>
              <span className="text-2xl font-bold text-muted-foreground self-center">vs</span>
              <div>
                <p className="text-3xl font-bold text-destructive">{opponentScore ?? "?"}</p>
                <p className="text-xs text-muted-foreground">{opponentName || "รอคู่แข่ง"}</p>
              </div>
            </div>
            <Button onClick={() => setBattleResult(null)} className="w-full">กลับ</Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Swords className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Quiz Battle</h1>
            <p className="text-sm text-muted-foreground">ท้าแข่งตอบคำถาม (ใช้ 2 Tokens)</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> สร้าง Battle</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>สร้าง Quiz Battle ใหม่</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder="เลือกวิชา" /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={createBattle} disabled={creating || !subject} className="w-full">
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Swords className="w-4 h-4 mr-2" />}
                สร้าง Battle (2 Tokens)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pendingBattles.length > 0 && (
        <div>
          <h2 className="font-heading font-semibold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" /> Battle ที่รอผู้เข้าร่วม
          </h2>
          <div className="space-y-3">
            {pendingBattles.map(b => (
              <Card key={b.id} className="p-4 border-0 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-medium">{b.subject}</p>
                  <p className="text-xs text-muted-foreground">โดย {b.challenger_name}</p>
                </div>
                <Button size="sm" onClick={() => joinBattle(b)}>เข้าร่วม</Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-heading font-semibold mb-3">Battle ของฉัน</h2>
        {myBattles.length === 0 ? (
          <Card className="p-8 border-0 shadow-sm text-center">
            <p className="text-muted-foreground">ยังไม่มี Battle</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {myBattles.map(b => (
              <Card key={b.id} className="p-4 border-0 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => playBattle(b)}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{b.subject}</p>
                    <Badge variant={b.status === "completed" ? "secondary" : "default"} className="text-xs">
                      {b.status === "pending" ? "รอคู่แข่ง" : b.status === "in_progress" ? "กำลังแข่ง" : "เสร็จสิ้น"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {b.challenger_name} vs {b.opponent_name || "???"}
                  </p>
                </div>
                {b.status === "completed" && b.winner_id === user?.id && (
                  <Badge className="bg-amber-100 text-amber-700">🏆 ชนะ</Badge>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}