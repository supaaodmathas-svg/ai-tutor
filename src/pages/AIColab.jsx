import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CourseQuiz from "@/components/colab/CourseQuiz";
import { Loader2, Building2, KeyRound, BookOpen, GraduationCap, ArrowLeft, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const COLAB_ACCESS_CODE = "Dino Tutor99";

export default function AIColab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [member, setMember] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("gate"); // gate | register | courses | quiz
  const [accessCode, setAccessCode] = useState("");
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstId, setSelectedInstId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [courses, setCourses] = useState([]);
  const [activeCourse, setActiveCourse] = useState(null);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      const members = await base44.entities.InstitutionMember.filter({ user_id: user.id });
      if (members.length > 0) {
        await activateMember(members[0]);
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const activateMember = async (m) => {
    setMember(m);
    const insts = await base44.entities.Institution.list();
    const inst = insts.find((i) => i.id === m.institution_id);
    setInstitution(inst || null);
    const all = await base44.entities.Course.filter({ institution_id: m.institution_id });
    const enrolled = (m.course_ids || []).length > 0
      ? all.filter((c) => m.course_ids.includes(c.id))
      : all;
    setCourses(enrolled);
    setStep("courses");
  };

  const handleAccessCode = () => {
    if (!accessCode.trim()) {
      toast({ title: "กรุณากรอกรหัส", variant: "destructive" });
      return;
    }
    loadInstitutions();
    setStep("register");
  };

  const loadInstitutions = async () => {
    const list = await base44.entities.Institution.list();
    setInstitutions(list);
  };

  const handleVerify = async () => {
    if (!selectedInstId || !studentName.trim() || !studentCode.trim()) {
      toast({ title: "กรุณากรอกข้อมูลให้ครบ", variant: "destructive" });
      return;
    }
    setVerifying(true);
    const records = await base44.entities.InstitutionMember.filter({
      institution_id: selectedInstId,
      student_code: studentCode.trim()
    });
    const rec = records[0];
    if (!rec) {
      toast({ title: "❌ ไม่พบรหัสนักเรียน", description: "รหัสนักเรียนนี้ไม่มีในสถาบันที่เลือก", variant: "destructive" });
      setVerifying(false);
      return;
    }
    if (rec.student_name.trim() !== studentName.trim()) {
      toast({ title: "❌ ชื่อไม่ตรงกับรหัสนักเรียน", variant: "destructive" });
      setVerifying(false);
      return;
    }
    if (rec.user_id && rec.user_id !== user.id) {
      toast({ title: "❌ รหัสนี้ถูกผูกกับบัญชีอื่นแล้ว", variant: "destructive" });
      setVerifying(false);
      return;
    }
    await base44.entities.InstitutionMember.update(rec.id, { user_id: user.id, joined_date: new Date().toISOString() });
    await activateMember({ ...rec, user_id: user.id });
    setVerifying(false);
    toast({ title: "✅ เข้าสู่ AI Colab สำเร็จ!", description: `ยินดีต้อนรับ ${rec.student_name}` });
  };

  const unlink = async () => {
    if (!member) return;
    await base44.entities.InstitutionMember.update(member.id, { user_id: "" });
    setMember(null);
    setInstitution(null);
    setCourses([]);
    setAccessCode("");
    setSelectedInstId("");
    setStudentName("");
    setStudentCode("");
    setStep("gate");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Course quiz view
  if (activeCourse) {
    return <CourseQuiz course={activeCourse} onBack={() => setActiveCourse(null)} />;
  }

  // Gate — enter access code
  if (step === "gate") {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">AI Colab</h1>
              <p className="text-sm text-muted-foreground">เรียนกับสถาบันของคุณ ผ่าน License AI</p>
            </div>
          </div>
        </motion.div>

        <Card className="p-6 border-0 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <KeyRound className="w-5 h-5" />
            <h2 className="font-display font-bold">กรอกรหัสเข้าใช้งาน</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            รับรหัสพิเศษจากสถาบันของคุณเพื่อเข้าใช้ฟีเจอร์ AI Colab
          </p>
          <Input
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="ใส่รหัสอะไรก็ได้"
            onKeyDown={(e) => e.key === "Enter" && handleAccessCode()}
          />
          <Button onClick={handleAccessCode} className="w-full">
            <KeyRound className="w-4 h-4 mr-2" /> เข้าสู่ AI Colab
          </Button>
        </Card>
      </div>
    );
  }

  // Register — select institution + name + student code
  if (step === "register") {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <button onClick={() => setStep("gate")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> กลับ
        </button>
        <Card className="p-6 border-0 shadow-lg space-y-4">
          <h2 className="font-display font-bold text-lg">เชื่อมต่อกับสถาบัน</h2>

          <div>
            <label className="text-sm font-semibold mb-2 block">🏫 สถาบันของคุณ</label>
            <Select value={selectedInstId} onValueChange={setSelectedInstId}>
              <SelectTrigger><SelectValue placeholder="เลือกสถาบัน" /></SelectTrigger>
              <SelectContent>
                {institutions.map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">👤 ชื่อ-นามสกุล</label>
            <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="ชื่อที่สถาบันบันทึกไว้" />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">🔑 รหัสนักเรียน</label>
            <Input value={studentCode} onChange={(e) => setStudentCode(e.target.value)} placeholder="รหัสที่สถาบันออกให้" />
          </div>

          <Button onClick={handleVerify} disabled={verifying} className="w-full">
            {verifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GraduationCap className="w-4 h-4 mr-2" />}
            ยืนยันและเข้าใช้งาน
          </Button>
        </Card>
      </div>
    );
  }

  // Courses list
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {institution?.logo_url ? (
            <img src={institution.logo_url} alt={institution.name} className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-display font-bold">AI Colab</h1>
            <p className="text-sm text-muted-foreground">
              {institution?.name} · {member?.student_name} ({member?.student_code})
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={unlink}>
          <LogOut className="w-4 h-4 mr-1" /> ออกจากสถาบัน
        </Button>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-primary" />
          <h2 className="font-display font-semibold">Course ที่คุณสมัครไว้</h2>
        </div>

        {courses.length === 0 ? (
          <Card className="p-8 border-0 shadow text-center">
            <p className="text-muted-foreground">ยังไม่มี Course ที่ลงทะเบียนไว้ในสถาบันนี้</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card
                  className="p-5 border-0 shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  onClick={() => setActiveCourse(c)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <Badge variant="outline">{c.subject}</Badge>
                  </div>
                  <h3 className="font-display font-bold">{c.title}</h3>
                  {c.grade_level && <p className="text-xs text-muted-foreground mt-1">{c.grade_level}</p>}
                  {c.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{c.description}</p>}
                  <p className="text-xs text-primary font-semibold mt-3">
                    {c.exam_bank?.length || 0} ข้อสอบใน exam bank
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}