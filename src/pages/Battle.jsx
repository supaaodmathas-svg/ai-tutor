import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QuizQuestion from "@/components/QuizQuestion";
import { Swords, Loader2, Trophy, CheckCircle, Plus, Hash, Users, Clock, Zap, ArrowRight, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

const subjects = ["คณิตศาสตร์ 1", "คณิตศาสตร์ 2", "ฟิสิกส์", "เคมี", "ชีววิทยา", "ภาษาอังกฤษ", "ภาษาไทย", "สังคมศึกษา"];
const BATTLE_COST = 5;

function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function Battle() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [view, setView] = useState("home"); // home | create | join | waiting | playing | result
  const [subject, setSubject] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [activeBattle, setActiveBattle] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Poll for battle updates when waiting or playing
  const shouldPoll = view === "waiting" || (view === "playing" && submitted);
  useEffect(() => {
    if (!activeBattle?.id || !shouldPoll) return;
    const interval = setInterval(async () => {
      const updated = await base44.entities.QuizBattle.filter({ id: activeBattle.id });
      if (updated && updated[0]) {
        const b = updated[0];
        setActiveBattle(b);
        // Opponent joined => start playing
        if (view === "waiting" && b.opponent_id) {
          setView("playing");
          setAnswers(new Array(b.questions.length).fill(-1));
          setCurrentIndex(0);
        }
        // Both submitted => show result
        if (b.status === "completed") {
          setView("result");
          clearInterval(interval);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeBattle?.id, shouldPoll, view]);

  const { data: myBattles = [] } = useQuery({
    queryKey: ["my-battles", user?.id],
    queryFn: () => base44.entities.QuizBattle.filter({}, "-created_date", 20),
    enabled: !!user?.id,
    refetchInterval: view === "home" ? 5000 : false,
    select: (data) => data.filter(b => b.challenger_id === user?.id || b.opponent_id === user?.id),
  });

  const checkTokens = () => {
    if ((user?.tokens ?? 0) < BATTLE_COST) {
      toast({ title: "⚠️ Token ไม่เพียงพอ", description: `ต้องใช้ ${BATTLE_COST} Tokens กรุณาเติม Token ก่อน`, variant: "destructive" });
      return false;
    }
    return true;
  };

  const createBattle = async () => {
    if (!subject || !checkTokens()) return;
    setCreating(true);
    const roomCode = generateRoomCode();
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `สร้างข้อสอบแข่งขันวิชา ${subject} จำนวน 5 ข้อ ระดับปานกลาง-ยาก สำหรับมัธยมปลาย ภาษาไทย แต่ละข้อมี 4 ตัวเลือก ห้ามมี prefix A. B. C. D. ในตัวเลือก`,
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

    const battle = await base44.entities.QuizBattle.create({
      subject,
      challenger_id: user.id,
      challenger_name: user.full_name || user.email,
      questions: res.questions,
      status: "pending",
      room_code: roomCode,
    });
    await base44.auth.updateMe({ tokens: (user?.tokens ?? 0) - BATTLE_COST });
    setActiveBattle(battle);
    setCreating(false);
    setView("waiting");
  };

  const joinBattle = async () => {
    if (!roomCodeInput.trim() || !checkTokens()) return;
    setJoining(true);
    const battles = await base44.entities.QuizBattle.filter({ room_code: roomCodeInput.trim(), status: "pending" });
    if (!battles || battles.length === 0) {
      toast({ title: "ไม่พบห้อง", description: "รหัสห้องไม่ถูกต้องหรือห้องเต็มแล้ว", variant: "destructive" });
      setJoining(false);
      return;
    }
    const battle = battles[0];
    if (battle.challenger_id === user.id) {
      toast({ title: "ไม่สามารถเข้าห้องตัวเองได้", variant: "destructive" });
      setJoining(false);
      return;
    }
    const updated = await base44.entities.QuizBattle.update(battle.id, {
      opponent_id: user.id,
      opponent_name: user.full_name || user.email,
      status: "in_progress",
    });
    await base44.auth.updateMe({ tokens: (user?.tokens ?? 0) - BATTLE_COST });
    setActiveBattle({ ...battle, opponent_id: user.id, opponent_name: user.full_name || user.email, status: "in_progress" });
    setAnswers(new Array(battle.questions.length).fill(-1));
    setCurrentIndex(0);
    setJoining(false);
    setView("playing");
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
    const updateData = isChallenger
      ? { challenger_answers: answers, challenger_score: score }
      : { opponent_answers: answers, opponent_score: score };

    const otherAnswered = isChallenger
      ? activeBattle.opponent_answers?.length > 0
      : activeBattle.challenger_answers?.length > 0;

    if (otherAnswered) {
      const otherScore = isChallenger ? activeBattle.opponent_score : activeBattle.challenger_score;
      const winnerId = score > otherScore ? user.id : score < otherScore ? (isChallenger ? activeBattle.opponent_id : activeBattle.challenger_id) : "draw";
      updateData.status = "completed";
      updateData.winner_id = winnerId;
    }

    await base44.entities.QuizBattle.update(activeBattle.id, updateData);
    setActiveBattle(prev => ({ ...prev, ...updateData }));
    setSubmitted(true);
    if (updateData.status === "completed") {
      setView("result");
    }
    queryClient.invalidateQueries({ queryKey: ["my-battles"] });
  };

  const reset = () => {
    setView("home");
    setActiveBattle(null);
    setAnswers([]);
    setSubmitted(false);
    setRoomCodeInput("");
    setSubject("");
    queryClient.invalidateQueries({ queryKey: ["my-battles"] });
  };

  // --- RESULT VIEW ---
  if (view === "result" && activeBattle) {
    const isChallenger = activeBattle.challenger_id === user?.id;
    const myScore = isChallenger ? activeBattle.challenger_score : activeBattle.opponent_score;
    const opponentScore = isChallenger ? activeBattle.opponent_score : activeBattle.challenger_score;
    const opponentName = isChallenger ? activeBattle.opponent_name : activeBattle.challenger_name;
    const isWinner = activeBattle.winner_id === user?.id;
    const isDraw = activeBattle.winner_id === "draw";

    return (
      <div className="max-w-lg mx-auto px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className={`p-8 border-0 shadow-2xl text-center relative overflow-hidden ${isWinner ? "bg-gradient-to-br from-amber-50 to-orange-50" : isDraw ? "bg-gradient-to-br from-blue-50 to-indigo-50" : "bg-gradient-to-br from-slate-50 to-gray-100"}`}>
            <div className="absolute inset-0 opacity-5">
              <div className="w-64 h-64 rounded-full bg-primary absolute -top-16 -right-16" />
            </div>
            <div className="relative z-10">
              <div className={`w-24 h-24 rounded-3xl mx-auto mb-4 flex items-center justify-center text-5xl ${isWinner ? "bg-amber-100" : isDraw ? "bg-blue-100" : "bg-gray-100"}`}>
                {isWinner ? "🏆" : isDraw ? "🤝" : "😢"}
              </div>
              <h1 className="text-3xl font-display font-bold mb-1">
                {isWinner ? "คุณชนะ!" : isDraw ? "เสมอกัน!" : "แพ้ครั้งนี้"}
              </h1>
              <p className="text-muted-foreground text-sm mb-6">{activeBattle.subject}</p>
              <div className="flex justify-center items-center gap-6 mb-8">
                <div className="text-center">
                  <div className={`text-5xl font-display font-black ${isWinner ? "text-amber-500" : "text-primary"}`}>{myScore ?? 0}</div>
                  <p className="text-sm font-medium mt-1">คุณ</p>
                </div>
                <div className="text-2xl font-bold text-muted-foreground">vs</div>
                <div className="text-center">
                  <div className={`text-5xl font-display font-black ${!isWinner && !isDraw ? "text-amber-500" : "text-destructive"}`}>{opponentScore ?? 0}</div>
                  <p className="text-sm font-medium mt-1">{opponentName || "คู่แข่ง"}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4">จาก {activeBattle.questions?.length ?? 5} ข้อ</p>
              <Button onClick={reset} className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white">
                <RotateCcw className="w-4 h-4 mr-2" /> กลับหน้าหลัก
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // --- WAITING VIEW (submitted but opponent not done) ---
  if (view === "playing" && submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-10 border-0 shadow-xl">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold mb-2">รอคู่แข่งทำเสร็จ...</h2>
            <p className="text-muted-foreground text-sm">ระบบจะแสดงผลอัตโนมัติเมื่อทำครบทั้งคู่</p>
          </Card>
        </motion.div>
      </div>
    );
  }

  // --- PLAYING VIEW ---
  if (view === "playing" && activeBattle) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-display font-bold">{activeBattle.subject}</h1>
          </div>
          <Badge variant="outline" className="font-mono">ห้อง #{activeBattle.room_code}</Badge>
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
        <div className="flex justify-center gap-2 flex-wrap">
          {activeBattle.questions.map((_, i) => (
            <button key={i} onClick={() => setCurrentIndex(i)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${i === currentIndex ? "bg-primary text-primary-foreground shadow-lg" : answers[i] !== -1 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- WAITING FOR OPPONENT ---
  if (view === "waiting" && activeBattle) {
    return (
      <div className="max-w-lg mx-auto px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-10 border-0 shadow-xl text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">รอคู่แข่ง...</h2>
            <p className="text-muted-foreground text-sm mb-6">แชร์รหัสห้องให้เพื่อนของคุณ</p>
            <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-6 mb-6">
              <p className="text-xs text-white/70 mb-1">รหัสห้อง</p>
              <p className="text-5xl font-display font-black text-white tracking-widest">{activeBattle.room_code}</p>
              <p className="text-xs text-white/70 mt-2">วิชา: {activeBattle.subject}</p>
            </div>
            <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground mb-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>กำลังรอผู้เข้าร่วม...</span>
            </div>
            <Button variant="outline" onClick={reset} className="w-full">ยกเลิก</Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  // --- CREATE VIEW ---
  if (view === "create") {
    return (
      <div className="max-w-md mx-auto px-4">
        <Card className="p-6 border-0 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <Plus className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display font-bold">สร้างห้อง Battle</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">เลือกวิชา</p>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder="เลือกวิชา..." /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">ค่าใช้จ่าย {BATTLE_COST} Tokens</p>
                <p className="text-xs text-amber-600">คงเหลือ: {user?.tokens ?? 0} Tokens</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setView("home")} className="flex-1">← กลับ</Button>
              <Button onClick={createBattle} disabled={creating || !subject} className="flex-1 bg-gradient-to-r from-primary to-accent">
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Swords className="w-4 h-4 mr-2" />}
                {creating ? "กำลังสร้าง..." : "สร้างห้อง"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // --- JOIN VIEW ---
  if (view === "join") {
    return (
      <div className="max-w-md mx-auto px-4">
        <Card className="p-6 border-0 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <Hash className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display font-bold">เข้าร่วม Battle</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">รหัสห้อง 6 หลัก</p>
              <Input
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-3xl font-display font-bold h-16 tracking-widest"
                maxLength={6}
              />
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">ค่าใช้จ่าย {BATTLE_COST} Tokens</p>
                <p className="text-xs text-amber-600">คงเหลือ: {user?.tokens ?? 0} Tokens</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setView("home")} className="flex-1">← กลับ</Button>
              <Button onClick={joinBattle} disabled={joining || roomCodeInput.length !== 6} className="flex-1 bg-gradient-to-r from-primary to-accent">
                {joining ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                {joining ? "กำลังเข้าร่วม..." : "เข้าร่วม"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // --- HOME VIEW ---
  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Swords className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-display font-black mb-2">Quiz Battle</h1>
          <p className="text-muted-foreground">ท้าแข่งแบบ Real-time ด้วยรหัสห้อง</p>
          <Badge variant="outline" className="mt-2">ใช้ {BATTLE_COST} Tokens ต่อ 1 เกม</Badge>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
            onClick={() => setView("create")}>
            <Plus className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-display font-bold">สร้างห้อง</h3>
            <p className="text-xs opacity-70 mt-1">สร้างและรอคู่แข่งเข้าร่วม</p>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-accent to-accent/80 text-accent-foreground"
            onClick={() => setView("join")}>
            <Hash className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-display font-bold">เข้าร่วมห้อง</h3>
            <p className="text-xs opacity-70 mt-1">กรอกรหัส 6 หลักจากเพื่อน</p>
          </Card>
        </motion.div>
      </div>

      {myBattles.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="font-heading font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> ประวัติการแข่งขัน
          </h2>
          <div className="space-y-2">
            {myBattles.map(b => {
              const isChallenger = b.challenger_id === user?.id;
              const myScore = isChallenger ? b.challenger_score : b.opponent_score;
              const opponentScore = isChallenger ? b.opponent_score : b.challenger_score;
              const opponentName = isChallenger ? b.opponent_name : b.challenger_name;
              const isWinner = b.winner_id === user?.id;
              const isDraw = b.winner_id === "draw";
              return (
                <Card key={b.id} className="p-4 border-0 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{b.subject}</p>
                        {b.room_code && <span className="text-xs text-muted-foreground font-mono">#{b.room_code}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        vs {opponentName || "รอคู่แข่ง"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {b.status === "completed" && (
                        <div className="text-right">
                          <p className="text-sm font-bold">{myScore ?? 0} - {opponentScore ?? 0}</p>
                          <Badge className={`text-xs ${isWinner ? "bg-amber-100 text-amber-700" : isDraw ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                            {isWinner ? "🏆 ชนะ" : isDraw ? "🤝 เสมอ" : "😢 แพ้"}
                          </Badge>
                        </div>
                      )}
                      {b.status === "pending" && (
                        <Badge variant="outline" className="text-xs">รอคู่แข่ง</Badge>
                      )}
                      {b.status === "in_progress" && (
                        <Badge className="text-xs bg-green-100 text-green-700">กำลังแข่ง</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}