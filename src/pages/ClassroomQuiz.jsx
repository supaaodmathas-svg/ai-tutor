import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Trophy, CheckCircle, XCircle, Clock, Users, Play } from "lucide-react";
import { motion } from "framer-motion";

const QUESTION_TIME = 20;

export default function ClassroomQuiz() {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [room, setRoom] = useState(null);
  const [phase, setPhase] = useState("enter"); // enter, waiting, play, result
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [locked, setLocked] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(null);
  const [lastPicked, setLastPicked] = useState(null);

  const questions = room?.questions || [];

  // realtime subscription
  useEffect(() => {
    if (!room) return;
    const unsub = base44.entities.ClassroomQuiz.subscribe((event) => {
      if (event.id === room.id) {
        base44.entities.ClassroomQuiz.get(room.id).then((updated) => {
          setRoom(updated);
          if (updated.status === "active" && phase === "waiting") {
            startPlay();
          }
          if (updated.status === "completed") {
            setPhase("result");
          }
        });
      }
    });
    return unsub;
  }, [room?.id, phase]);

  // timer
  useEffect(() => {
    if (phase !== "play" || locked) return;
    setTimeLeft(QUESTION_TIME);
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, currentQ, locked]);

  // timeout lock
  useEffect(() => {
    if (phase === "play" && timeLeft === 0 && !locked) {
      setLocked(true);
      setLastPicked(-1);
      setLastCorrect(questions[currentQ]?.correct_answer);
      const a = [...answers]; a[currentQ] = -1; setAnswers(a);
    }
  }, [timeLeft, phase, locked, currentQ]);

  const startPlay = () => {
    setCurrentQ(0);
    setAnswers(new Array(questions.length).fill(-1));
    setScore(0);
    setLocked(false);
    setLastCorrect(null);
    setLastPicked(null);
    setPhase("play");
  };

  const handleJoin = async () => {
    setLoading(true); setError("");
    try {
      const rooms = await base44.entities.ClassroomQuiz.filter({ room_code: code.trim().toUpperCase() });
      if (!rooms.length) { setError("ไม่พบห้องที่มีรหัสนี้"); setLoading(false); return; }
      const r = rooms[0];
      const parts = r.participants || [];
      if (!parts.find((p) => p.user_id === user.id)) {
        parts.push({ user_id: user.id, user_name: user.full_name || user.email, score: 0, answers: [], completed: false, joined_at: new Date().toISOString() });
        await base44.entities.ClassroomQuiz.update(r.id, { participants: parts });
      }
      setRoom({ ...r, participants: parts });
      if (r.status === "active") startPlay();
      else if (r.status === "completed") setPhase("result");
      else setPhase("waiting");
      setLoading(false);
    } catch (e) { setError(e.message || "เกิดข้อผิดพลาด"); setLoading(false); }
  };

  const handleAnswer = (idx) => {
    if (locked) return;
    setLocked(true);
    const q = questions[currentQ];
    const correct = idx === q.correct_answer;
    const pts = correct ? 500 + timeLeft * 25 : 0;
    const a = [...answers]; a[currentQ] = idx; setAnswers(a);
    if (correct) setScore((s) => s + pts);
    setLastPicked(idx);
    setLastCorrect(q.correct_answer);
  };

  const submitScore = async () => {
    const fresh = await base44.entities.ClassroomQuiz.get(room.id);
    const parts = fresh.participants || [];
    const me = parts.find((p) => p.user_id === user.id);
    if (me) {
      me.score = score;
      me.answers = answers;
      me.completed = true;
    } else {
      parts.push({ user_id: user.id, user_name: user.full_name || user.email, score, answers, completed: true, joined_at: new Date().toISOString() });
    }
    await base44.entities.ClassroomQuiz.update(room.id, { participants: parts });
    setRoom({ ...fresh, participants: parts });
    setPhase("result");
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((c) => c + 1);
      setLocked(false);
      setLastCorrect(null);
      setLastPicked(null);
    } else {
      submitScore();
    }
  };

  const leave = () => {
    setRoom(null); setPhase("enter"); setCode(""); setError("");
    setScore(0); setCurrentQ(0); setAnswers([]);
  };

  // ===== Enter code screen =====
  if (phase === "enter") {
    return (
      <div className="max-w-md mx-auto pt-8 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold">เข้าร่วมห้องเรียนสด</h1>
          <p className="text-sm text-muted-foreground mt-1">กรอกรหัสที่ครูให้ในห้องเรียน</p>
        </div>
        <Card className="p-6 border-0 shadow-lg space-y-4">
          {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="เช่น AB12CD"
            className="h-14 text-center text-2xl font-mono tracking-widest"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
          <Button onClick={handleJoin} className="w-full h-12" disabled={loading || !code.trim()}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            เข้าร่วม
          </Button>
        </Card>
      </div>
    );
  }

  // ===== Waiting screen =====
  if (phase === "waiting") {
    return (
      <div className="max-w-md mx-auto pt-8 text-center space-y-6">
        <Card className="p-8 border-0 shadow-xl">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold">รอครูเริ่มเกม...</h2>
          <p className="text-sm text-muted-foreground mt-1">ห้อง {room.title}</p>
          <div className="my-6 py-6 rounded-2xl bg-primary text-primary-foreground">
            <p className="text-xs opacity-80">รหัสห้อง</p>
            <p className="text-3xl font-display font-black tracking-widest">{room.room_code}</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{(room.participants || []).length} คนเข้าร่วมแล้ว</span>
          </div>
        </Card>
        <Button variant="outline" onClick={leave}>ออกจากห้อง</Button>
      </div>
    );
  }

  // ===== Result / Leaderboard =====
  if (phase === "result") {
    const board = [...(room.participants || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
    const myRank = board.findIndex((p) => p.user_id === user.id) + 1;
    const myEntry = board.find((p) => p.user_id === user.id);
    return (
      <div className="max-w-md mx-auto pt-8 space-y-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-8 border-0 shadow-xl text-center bg-gradient-to-br from-primary/5 to-accent/5">
            <Trophy className="w-14 h-14 text-amber-500 mx-auto mb-3" />
            <h2 className="text-xl font-display font-bold">อันดับที่ {myRank || "-"}</h2>
            <p className="text-4xl font-display font-black text-primary my-2">{myEntry?.score || 0}</p>
            <p className="text-sm text-muted-foreground">คะแนนของคุณ · {questions.length} ข้อ</p>
          </Card>
        </motion.div>

        <Card className="p-5 border-0 shadow-lg space-y-3">
          <p className="font-semibold flex items-center gap-2"><Trophy className="w-4 h-4 text-accent" /> ลีดเดอร์บอร์ด</p>
          <div className="space-y-2">
            {board.map((p, i) => (
              <div key={p.user_id || i} className={`flex items-center justify-between p-3 rounded-xl ${p.user_id === user.id ? "bg-primary/10 border border-primary/30" : "bg-muted/40"}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-orange-400 text-white" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                  <span className="font-semibold text-sm">{p.user_name}{p.user_id === user.id ? " (คุณ)" : ""}</span>
                </div>
                <span className="font-bold text-primary">{p.score || 0}</span>
              </div>
            ))}
          </div>
        </Card>
        <Button variant="outline" className="w-full" onClick={leave}>ออกจากห้อง</Button>
      </div>
    );
  }

  // ===== Play screen =====
  if (phase === "play" && questions.length > 0) {
    const q = questions[currentQ];
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <Badge className="bg-primary/10 text-primary border-0">ข้อ {currentQ + 1}/{questions.length}</Badge>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold ${timeLeft <= 5 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
            <Clock className="w-4 h-4" />
            {timeLeft}s
          </div>
          <Badge variant="outline">⚡ {score}</Badge>
        </div>

        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }} />
        </div>

        <motion.div key={currentQ} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 border-0 shadow-lg">
            <p className="text-lg font-display font-bold mb-5">{q.question}</p>
            <div className="grid grid-cols-1 gap-3">
              {q.choices.map((c, i) => {
                let cls = "border-border bg-card hover:border-primary/40";
                if (locked) {
                  if (i === q.correct_answer) cls = "border-green-500 bg-green-50 text-green-700";
                  else if (i === lastPicked) cls = "border-destructive bg-destructive/10 text-destructive";
                  else cls = "border-border bg-muted/40 opacity-60";
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={locked}
                    className={`text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-3 ${cls}`}
                  >
                    <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">{["ก", "ข", "ค", "ง"][i]}</span>
                    <span className="flex-1">{c}</span>
                    {locked && i === q.correct_answer && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {locked && i === lastPicked && i !== q.correct_answer && <XCircle className="w-5 h-5 text-destructive" />}
                  </button>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {locked && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-4 border-0 shadow bg-accent/5">
              <p className="text-sm">
                {lastPicked === q.correct_answer ? "✅ ถูกต้อง! " : lastPicked === -1 ? "⏰ หมดเวลา " : "❌ ยังไม่ถูก "}
                {q.explanation}
              </p>
            </Card>
            <Button onClick={handleNext} className="w-full mt-3 bg-gradient-to-r from-primary to-accent">
              {currentQ < questions.length - 1 ? "ข้อถัดไป →" : "ดูผลคะแนน 🏆"}
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  return null;
}