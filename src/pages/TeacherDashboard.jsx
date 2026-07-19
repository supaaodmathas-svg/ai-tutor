import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, Users, BookOpen, TrendingUp, Award, Search, KeyRound, Layers } from "lucide-react";
import { motion } from "framer-motion";
import StudentStatDialog from "@/components/teacher/StudentStatDialog";
import CreateClassroomQuizDialog from "@/components/teacher/CreateClassroomQuizDialog";
import ClassroomQuizHost from "@/components/teacher/ClassroomQuizHost";
import { Gamepad2 } from "lucide-react";

export default function TeacherDashboard() {
  const { user, checkUserAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [institution, setInstitution] = useState(null);
  const [members, setMembers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [quizCounts, setQuizCounts] = useState({});
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [quizData, setQuizData] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);

  // access code gate
  const [verifying, setVerifying] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  const linkedInstId = user?.teacher_institution_id;

  useEffect(() => {
    (async () => {
      if (linkedInstId) {
        await loadDashboard(linkedInstId);
      }
      setLoading(false);
    })();
  }, [user?.id, linkedInstId]);

  const loadDashboard = async (instId) => {
    if (!instId) return;
    try {
      const insts = await base44.entities.Institution.filter({ id: instId });
      setInstitution(insts[0] || null);
    } catch {
      setInstitution(null);
    }
    const mems = await base44.entities.InstitutionMember.filter({ institution_id: instId });
    setMembers(mems);
    const cs = await base44.entities.Course.filter({ institution_id: instId });
    setCourses(cs);
    const data = {};
    const counts = {};
    await Promise.all(
      mems.map(async (m) => {
        if (m.user_id) {
          try {
            const quizzes = await base44.entities.Quiz.filter({ created_by_id: m.user_id, completed: true });
            data[m.user_id] = quizzes;
            counts[m.user_id] = quizzes.length;
          } catch {
            data[m.user_id] = [];
            counts[m.user_id] = 0;
          }
        } else {
          data[m.id] = [];
          counts[m.id] = 0;
        }
      })
    );
    setQuizData(data);
    setQuizCounts(counts);

    // load teacher's open classroom quiz rooms
    try {
      const myRooms = await base44.entities.ClassroomQuiz.filter({ teacher_id: user.id });
      const openRoom = myRooms
        .filter((r) => r.status !== "completed")
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
      setActiveRoom(openRoom || null);
    } catch { setActiveRoom(null); }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setCodeError("");
    try {
      const insts = await base44.entities.Institution.list();
      const matched = insts.find(
        (i) => i.access_code && i.access_code === codeInput.trim()
      );
      if (!matched) {
        setCodeError("รหัสไม่ถูกต้อง กรุณาตรวจสอบกับสถาบันของคุณ");
        setVerifying(false);
        return;
      }
      await base44.auth.updateMe({ teacher_institution_id: matched.id });
      setCodeInput("");
      await checkUserAuth();
      await loadDashboard(matched.id);
    } catch (err) {
      setCodeError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setVerifying(false);
    }
  };

  // filter by department
  const depMembers = department === "all"
    ? members
    : members.filter((m) => m.department === department);
  const depCourses = department === "all"
    ? courses
    : courses.filter((c) => c.department === department);

  const filteredMembers = depMembers.filter(
    (m) =>
      m.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.student_code?.toLowerCase().includes(search.toLowerCase())
  );
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (sortBy === "name") return (a.student_name || "").localeCompare(b.student_name || "", "th");
    const ca = quizCounts[a.user_id || a.id] || 0;
    const cb = quizCounts[b.user_id || b.id] || 0;
    return sortBy === "quizzes_desc" ? cb - ca : ca - cb;
  });

  const totalStudents = depMembers.length;
  const totalQuizzes = depMembers.reduce((sum, m) => sum + (quizCounts[m.user_id || m.id] || 0), 0);
  const linkedCount = depMembers.filter((m) => m.user_id).length;
  const avgPerStudent = totalStudents > 0 ? (totalQuizzes / totalStudents).toFixed(1) : "0";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // No linked institution yet → access code gate
  if (!linkedInstId) {
    return (
      <div className="space-y-6 max-w-md mx-auto pt-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-display font-bold">กรอกรหัสสถาบัน</h1>
          <p className="text-sm text-muted-foreground mt-1">
            กรุณากรอกรหัสที่ได้รับหลังจากซื้อไลเซนส์เพื่อเข้าถึงข้อมูลสถาบันของคุณ
          </p>
        </div>
        <Card className="p-6 border-0 shadow-lg space-y-4">
          {codeError && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{codeError}</div>
          )}
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <Input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="เช่น tutor45"
              className="h-12 text-center text-lg font-mono tracking-wider"
              autoFocus
            />
            <Button type="submit" className="w-full h-12" disabled={verifying || !codeInput.trim()}>
              {verifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
              ยืนยันรหัส
            </Button>
          </form>
          <p className="text-xs text-center text-muted-foreground">
            รหัสเชื่อมต่อได้เฉพาะสถาบันที่ได้รับอนุญาตเท่านั้น
          </p>
        </Card>
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
            {institution ? `${institution.name} · ครู ${user?.full_name || user?.email}` : "กำลังโหลดสถาบัน..."}
          </p>
        </div>
      </div>

      {/* เลือกภาควิชา */}
      {institution?.departments?.length > 0 && (
        <Card className="p-5 border-0 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Layers className="w-4 h-4" />
            <h2 className="font-display font-semibold">ภาควิชา</h2>
          </div>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="เลือกภาควิชา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกภาควิชา</SelectItem>
              {institution.departments.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {department !== "all" && (
            <p className="text-xs text-muted-foreground">
              กำลังดูข้อมูลของภาควิชา <span className="font-semibold text-primary">{department}</span>
            </p>
          )}
        </Card>
      )}

      {/* สถิติภาพรวม */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "จำนวนนักเรียน", value: totalStudents, iconClass: "bg-primary/10", textClass: "text-primary" },
          { icon: BookOpen, label: "Course ทั้งหมด", value: depCourses.length, iconClass: "bg-accent/15", textClass: "text-accent" },
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

      {/* ห้องเรียนสด (Kahoot) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <Gamepad2 className="w-5 h-5" />
          <h2 className="font-display font-semibold">ห้องเรียนสด (Kahoot)</h2>
        </div>
        {activeRoom ? (
          <ClassroomQuizHost room={activeRoom} onClose={() => setActiveRoom(null)} />
        ) : (
          <Card className="p-6 border-0 shadow text-center space-y-3">
            <Gamepad2 className="w-10 h-10 text-primary mx-auto" />
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              สร้างห้องเรียนสดให้นักเรียนเล่นข้อสอบชุดเดียวกันแบบแข่งขันสไตล์ Kahoot — ฟรี! นักเรียนไม่เสีย Token
            </p>
            <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-primary to-accent">
              <Gamepad2 className="w-4 h-4 mr-2" /> สร้างห้องใหม่
            </Button>
          </Card>
        )}
      </div>

      <CreateClassroomQuizDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        teacher={user}
        onCreated={(room) => setActiveRoom(room)}
      />

      {/* รายชื่อนักเรียน */}
      <Card className="p-5 border-0 shadow-lg space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-primary">
            <Users className="w-4 h-4" />
            <h2 className="font-display font-semibold">รายชื่อนักเรียน ({filteredMembers.length})</h2>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อ/รหัสนักเรียน"
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">ชื่อ (ก-ฮ)</SelectItem>
                <SelectItem value="quizzes_desc">ข้อสอบ มาก→น้อย</SelectItem>
                <SelectItem value="quizzes_asc">ข้อสอบ น้อย→มาก</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">ยังไม่มีนักเรียนในภาควิชานี้</p>
        ) : (
          <div className="space-y-2">
            {sortedMembers.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedStudent(m)}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {m.student_name?.charAt(0) || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{m.student_name}</p>
                    <p className="text-xs text-muted-foreground">รหัส {m.student_code}{m.department ? ` · ${m.department}` : ""}</p>
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
          <h2 className="font-display font-semibold">Course ในสถาบัน ({depCourses.length})</h2>
        </div>
        {depCourses.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">ยังไม่มี Course ในภาควิชานี้</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {depCourses.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-muted/40">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold">{c.title}</h3>
                  <Badge variant="outline">{c.subject}</Badge>
                </div>
                {c.department && <p className="text-xs text-primary font-semibold">{c.department}</p>}
                {c.grade_level && <p className="text-xs text-muted-foreground">{c.grade_level}</p>}
                {c.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                <p className="text-xs text-primary font-semibold mt-2">{c.exam_bank?.length || 0} ข้อสอบใน exam bank</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <StudentStatDialog
        student={selectedStudent}
        quizzes={selectedStudent ? (quizData[selectedStudent.user_id] || []) : []}
        open={!!selectedStudent}
        onOpenChange={(v) => !v && setSelectedStudent(null)}
      />
    </div>
  );
}