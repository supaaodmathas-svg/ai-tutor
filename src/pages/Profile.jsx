import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Save, Crown, Zap, BookOpen, Trophy, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const gradeOptions = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];
const subjectOptions = ["คณิตศาสตร์ 1", "คณิตศาสตร์ 2", "ฟิสิกส์", "เคมี", "ชีววิทยา", "ภาษาอังกฤษ", "ภาษาไทย", "สังคมศึกษา"];

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    age: "",
    grade_level: "",
    school: "",
    interested_subjects: [],
  });

  useEffect(() => {
    if (user) {
      setForm({
        age: user.age || "",
        grade_level: user.grade_level || "",
        school: user.school || "",
        interested_subjects: user.interested_subjects || [],
      });
    }
  }, [user]);

  const { data: placements = [] } = useQuery({
    queryKey: ["my-placements-profile"],
    queryFn: () => base44.entities.PlacementTest.filter({ completed: true }, "-created_date", 20),
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ["my-quizzes-profile"],
    queryFn: () => base44.entities.Quiz.filter({ completed: true }, "-created_date", 20),
  });

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    setSaving(false);
    toast({ title: "บันทึกสำเร็จ", description: "อัปเดตข้อมูลเรียบร้อยแล้ว" });
  };

  const toggleSubject = (subject) => {
    setForm(prev => ({
      ...prev,
      interested_subjects: prev.interested_subjects.includes(subject)
        ? prev.interested_subjects.filter(s => s !== subject)
        : [...prev.interested_subjects, subject],
    }));
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">โปรไฟล์</h1>
            <p className="text-sm text-muted-foreground">แก้ไขข้อมูลส่วนตัว</p>
          </div>
        </div>
      </motion.div>

      {/* Profile Header */}
      <Card className="p-6 border-0 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
            {user?.full_name?.[0] || "U"}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-heading font-bold">{user?.full_name || "ผู้ใช้"}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="w-3 h-3" /> {user?.tokens ?? 50} Tokens
              </Badge>
              {user?.is_premium && (
                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                  <Crown className="w-3 h-3 mr-1" /> PRO
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Form */}
      <Card className="p-6 border-0 shadow-md">
        <h3 className="font-heading font-semibold mb-4">ข้อมูลส่วนตัว</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>อายุ</Label>
              <Input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || "" })}
                placeholder="เช่น 16"
              />
            </div>
            <div>
              <Label>ระดับชั้น</Label>
              <Select value={form.grade_level} onValueChange={(v) => setForm({ ...form, grade_level: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกระดับชั้น" />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>โรงเรียน</Label>
            <Input
              value={form.school}
              onChange={(e) => setForm({ ...form, school: e.target.value })}
              placeholder="ชื่อโรงเรียน"
            />
          </div>
          <div>
            <Label className="mb-2 block">วิชาที่สนใจ</Label>
            <div className="flex flex-wrap gap-2">
              {subjectOptions.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSubject(s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    form.interested_subjects.includes(s)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            บันทึก
          </Button>
        </div>
      </Card>

      {/* Subject Levels */}
      {user?.subject_levels && Object.keys(user.subject_levels).length > 0 && (
        <Card className="p-6 border-0 shadow-md">
          <h3 className="font-heading font-semibold mb-3">เลเวลตามวิชา</h3>
          <div className="grid grid-cols-2 gap-2">
            {subjectOptions.map(s => {
              const lv = user.subject_levels[s];
              if (!lv) return null;
              return (
                <div key={s} className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg">
                  <span className="text-sm">{s}</span>
                  <Badge variant="secondary">Lv.{lv}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 border-0 shadow-sm text-center">
          <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-display font-bold">{placements.length}</p>
          <p className="text-xs text-muted-foreground">วัดระดับ</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm text-center">
          <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-display font-bold">{quizzes.length}</p>
          <p className="text-xs text-muted-foreground">ข้อสอบที่ทำ</p>
        </Card>
      </div>


    </div>
  );
}