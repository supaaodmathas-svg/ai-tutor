import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Zap } from "lucide-react";
import { AI_TUTOR_RULES } from "@/lib/aiTutorRules";

const subjects = ["คณิตศาสตร์", "วิทยาศาสตร์", "ภาษาอังกฤษ", "ภาษาไทย", "สังคมศึกษา", "ฟิสิกส์", "เคมี", "ชีววิทยา"];
const gradeOptions = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];

const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function CreateClassroomQuizDialog({ open, onOpenChange, teacher, onCreated }) {
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState("5");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!subject || !grade) return;
    setLoading(true);
    const count = parseInt(numQuestions);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${AI_TUTOR_RULES}
สร้างข้อสอบวิชา ${subject} ระดับชั้น ${grade} ${topic ? `หัวข้อ ${topic}` : "รวมทุกเนื้อหาในหลักสูตร"}
จำนวน ${count} ข้อ ใช้ภาษาไทย ระดับความยากปานกลาง สำหรับเล่นเกมในห้องเรียนสไตล์ Kahoot
กฎเข้มงวด:
- ส่งกลับ questions array ที่มีสมาชิก ${count} รายการพอดี
- แต่ละข้อมี choices อาร์เรย์ 4 รายการเสมอ
- correct_answer คือ index 0-3 เท่านั้น
- explanation อธิบายเหตุผลสั้นๆ`,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              minItems: count,
              maxItems: count,
              items: {
                type: "object",
                properties: {
                  level: { type: "number" },
                  question: { type: "string" },
                  choices: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } },
                  correct_answer: { type: "number" },
                  explanation: { type: "string" }
                }
              }
            }
          }
        }
      });
      const questions = (res.questions || []).slice(0, count);
      const room = await base44.entities.ClassroomQuiz.create({
        teacher_id: teacher.id,
        teacher_name: teacher.full_name || teacher.email,
        institution_id: teacher.teacher_institution_id || "",
        title: `${subject} ${grade}${topic ? ` - ${topic}` : ""}`,
        subject,
        grade_level: grade,
        room_code: genCode(),
        questions,
        participants: [],
        status: "waiting",
      });
      onOpenChange(false);
      setSubject(""); setGrade(""); setTopic("");
      onCreated(room);
    } catch (e) {
      alert("เกิดข้อผิดพลาดในการสร้างข้อสอบ: " + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>🎮 สร้างห้องเรียนสด</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">📚 วิชา</label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue placeholder="เลือกวิชา" /></SelectTrigger>
              <SelectContent>
                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">🎓 ระดับชั้น</label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger><SelectValue placeholder="เลือกระดับชั้น" /></SelectTrigger>
              <SelectContent>
                {gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">📖 หัวข้อ (ไม่ใส่ = รวมทุกเนื้อหา)</label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="เช่น พีชคณิต สมการ" />
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">🔢 จำนวนข้อ</label>
            <Select value={numQuestions} onValueChange={setNumQuestions}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 ข้อ</SelectItem>
                <SelectItem value="10">10 ข้อ</SelectItem>
                <SelectItem value="15">15 ข้อ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-3 rounded-xl bg-accent/10 text-sm text-accent-foreground">
            ✨ ฟรี! ครูสร้างได้ไม่จำกัด นักเรียนเล่นไม่เสีย Token
          </div>
          <Button onClick={handleCreate} className="w-full" disabled={loading || !subject || !grade}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            {loading ? "กำลังสร้างข้อสอบ..." : "สร้างห้อง"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}