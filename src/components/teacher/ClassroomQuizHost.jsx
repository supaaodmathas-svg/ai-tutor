import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Trophy, Users, X, Copy } from "lucide-react";

export default function ClassroomQuizHost({ room, onClose }) {
  const [live, setLive] = useState(room);

  useEffect(() => {
    setLive(room);
    const unsub = base44.entities.ClassroomQuiz.subscribe((event) => {
      if (event.id === room.id) {
        base44.entities.ClassroomQuiz.get(room.id).then(setLive);
      }
    });
    return unsub;
  }, [room.id]);

  const startGame = async () => {
    await base44.entities.ClassroomQuiz.update(room.id, { status: "active", started_at: new Date().toISOString() });
  };
  const endGame = async () => {
    await base44.entities.ClassroomQuiz.update(room.id, { status: "completed", ended_at: new Date().toISOString() });
  };

  const participants = live.participants || [];
  const leaderboard = [...participants].sort((a, b) => (b.score || 0) - (a.score || 0));
  const completedCount = participants.filter((p) => p.completed).length;

  const copyCode = () => {
    navigator.clipboard?.writeText(live.room_code);
  };

  return (
    <Card className="p-6 border-0 shadow-xl space-y-5 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">ห้องเรียนสด</p>
          <h2 className="text-lg font-display font-bold">{live.title}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      {/* Room code */}
      <div className="text-center py-4 rounded-2xl bg-primary text-primary-foreground">
        <p className="text-xs opacity-80 mb-1">รหัสเข้าห้อง</p>
        <div className="flex items-center justify-center gap-2">
          <p className="text-4xl font-display font-black tracking-widest">{live.room_code}</p>
          <button onClick={copyCode} className="opacity-80 hover:opacity-100"><Copy className="w-5 h-5" /></button>
        </div>
        <Badge className="mt-2 bg-white/20 border-0 text-white">
          {live.status === "waiting" ? "⏳ รอนักเรียนเข้า" : live.status === "active" ? "🔴 กำลังเล่น" : "✅ จบแล้ว"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-card text-center">
          <Users className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold">{participants.length}</p>
          <p className="text-xs text-muted-foreground">เข้าร่วม</p>
        </div>
        <div className="p-3 rounded-xl bg-card text-center">
          <Trophy className="w-5 h-5 mx-auto text-accent mb-1" />
          <p className="text-2xl font-bold">{completedCount}</p>
          <p className="text-xs text-muted-foreground">ทำเสร็จ</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {live.status === "waiting" && (
          <Button onClick={startGame} className="flex-1 bg-gradient-to-r from-primary to-accent">
            <Play className="w-4 h-4 mr-2" /> เริ่มเกม
          </Button>
        )}
        {live.status === "active" && (
          <Button onClick={endGame} variant="destructive" className="flex-1">
            <Square className="w-4 h-4 mr-2" /> จบเกม
          </Button>
        )}
        {live.status === "completed" && (
          <Button onClick={onClose} variant="outline" className="flex-1">ปิดห้อง</Button>
        )}
      </div>

      {/* Leaderboard */}
      <div>
        <p className="text-sm font-semibold mb-2 flex items-center gap-2"><Trophy className="w-4 h-4 text-accent" /> ลีดเดอร์บอร์ด</p>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีนักเรียนเข้าร่วม</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {leaderboard.map((p, i) => (
              <div key={p.user_id || i} className="flex items-center justify-between p-2.5 rounded-xl bg-card">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-orange-400 text-white" : "bg-muted text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-sm">{p.user_name}</p>
                    <p className="text-xs text-muted-foreground">{p.completed ? "ทำเสร็จ" : "ยังทำอยู่"}</p>
                  </div>
                </div>
                <p className="font-bold text-primary">{p.score || 0}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}