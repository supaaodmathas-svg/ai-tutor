import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, Users, BookOpen, TrendingUp, Award, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [institution, setInstitution] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstId, setSelectedInstId] = useState("");
  const [members, setMembers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [quizCounts, setQuizCounts] = useState({});
  const [search, setSearch] = useState("");
  const [savingInst, setSavingInst] = useState(false);

  useEffect(() => {
    (async () => {
      // โหลดรายชื่อสถาบันทั้งหมด
      const list = await base44.entities.Institution.list();
      setInstitutions(list);
      // ถ้า user เคยผูกสถาบันไว้ ใช้สถาบันนั้น
      const linked = user?.teacher_institution_id || "";
      if (linked) {
        setSelectedInstId(linked);
        await loadDashboard(linked, list);
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const loadDashboard = async (instId, list = institutions) => {
    if (!instId) return;
    const inst = list.find((i) => i.id === instId);
    setInstitution(inst || null);
    // นักเรียนในสถาบัน
    const mems = await base44.entities.InstitutionMember.filter({ institution_id: instId });
    setMembers(mems);
    // Course ในสถาบัน
    const cs = await base44.entities.Course.filter({ institution_id: instId });
    setCourses(cs);
    // นับ quiz ที่นักเรียนแต่ละคนทำ (ผ่าน user_id)
    const counts = {};
    await Promise.all(
      mems.map(async (m) => {
        if (m.user_id) {
          try {
            const quizzes = await base44.entities.Quiz.filter({ created_by_id: m.user_id, completed: true });
            counts[m.user_id] = quizzes.length;
          } catch {
            counts[m.user_id] = 0;
          }
        } else {
          counts[m.id] = 0;
        }
      })
    );
    setQuizCounts(counts);
  };

  const handleSelectInst = async (instId) => {
    setSelectedInstId(instId);
    await loadDashboard(instId);
  };

  const handleSaveInst = async () => {
    if (!selectedInstId) return;
    setSavingInst(true);
    try {
      await base44.auth.updateMe({ teacher_institution_id: selectedInstId });
    } catch (e) {
      console.error(e);
    }
    setSavingInst(false);
  };

  const filteredMembers = members.filter(
    (m) =>
      m.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.student_code?.toLowerCase().includes(search.toLowerCase())
  );

  // สถิติรวม
  const totalStudents = members.length;
  const totalQuizzes = Object.values(quizCounts).reduce((a, b) => a + b, 0);
  const linkedCount = members.filter((m) => m.user_id).length;
  const avgPerStudent = totalStudents > 0 ? (totalQuizzes / totalStudents).toFixed(1) : "0";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Teacher Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {institution ? `${institution.name} · ครู ${user?.full_name || user?.email}` : "เลือกสถาบันเพื่อดูสถิตินักเรียน"}
          </p>
        </div>
      </div>

      {/* เลือกสถาบัน */}
      <Card className="p-5 border-0 shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-accent">
          <Building2 className="w-4 h-4" />
          <h2 className="font-display font-semibold">สถาบันของคุณ</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedInstId} onValueChange={handleSelectInst}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="เลือกสถาบันที่คุณสอน" />
            </SelectTrigger>
            <SelectContent>
              {institutions.map((i) => (
                <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {user?.teacher_institution_id !== selectedInstId && selectedInstId && (
            <Button onClick={handleSaveInst} disabled={savingInst} variant="secondary">
              {savingInst ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              บันทึกสถาบันหลัก
            </Button>
          )}
        </div>
      </Card>

      {!selectedInstId ? (
        <Card className="p-8 border-0 shadow text-center">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">เลือกสถาบันเพื่อดูสถิตินักเรียน</p>
        </Card>
      ) : (
        <>
          {/* สถิติภาพรวม */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "จำนวนนักเรียน", value: totalStudents, iconClass: "bg-primary/10", textClass: "text-primary" },
              { icon: BookOpen, label: "Course ทั้งหมด", value: courses.length, iconClass: "bg-accent/15", textClass: "text-accent" },
              { icon: Award, label: "ทำข้อสอบรวม", value: totalQuizzes, iconClass: "bg-primary/10", textClass: "text-primary" },
              { icon: TrendingUp, label: "เฉลี่ยต่อคน", value: avgPerStudent, iconClass: "bg-accent/15", textClass: "text-accent" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="p-4 border-0 shadow">
                  <div className={`w-9 h-9 rounded-xl ${s.iconClass} flex items-center justify-center mb-2`}>
                    <s.icon className={`w-5 h-5 ${s.textClass}`} />
                  </div>
                  <p className="text-2xl font-display font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* รายชื่อนักเรียน */}
          <Card className="p-5 border-0 shadow-lg space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-primary">
                <Users className="w-4 h-4" />
                <h2 className="font-display font-semibold">รายชื่อนักเรียน ({filteredMembers.length})</h2>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาชื่อ/รหัสนักเรียน"
                  className="pl-9"
                />
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">ยังไม่มีนักเรียนในสถาบันนี้</p>
            ) : (
              <div className="space-y-2">
                {filteredMembers.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {m.student_name?.charAt(0) || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{m.student_name}</p>
                        <p className="text-xs text-muted-foreground">รหัส {m.student_code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={m.user_id ? "default" : "secondary"}>
                        {m.user_id ? "เชื่อมต่อแล้ว" : "ยังไม่เชื่อมต่อ"}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{quizCounts[m.user_id || m.id] || 0}</p>
                        <p className="text-[10px] text-muted-foreground">ข้อสอบที่ทำ</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          {/* Course ในสถาบัน */}
          <Card className="p-5 border-0 shadow-lg space-y-4">
            <div className="flex items-center gap-2 text-accent">
              <BookOpen className="w-4 h-4" />
              <h2 className="font-display font-semibold">Course ในสถาบัน ({courses.length})</h2>
            </div>
            {courses.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">ยังไม่มี Course</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {courses.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl bg-muted/40">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold">{c.title}</h3>
                      <Badge variant="outline">{c.subject}</Badge>
                    </div>
                    {c.grade_level && <p className="text-xs text-muted-foreground">{c.grade_level}</p>}
                    {c.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                    <p className="text-xs text-primary font-semibold mt-2">{c.exam_bank?.length || 0} ข้อสอบใน exam bank</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}