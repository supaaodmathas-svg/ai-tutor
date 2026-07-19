import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Award, Target, BookOpen } from "lucide-react";

export default function StudentStatDialog({ student, quizzes, open, onOpenChange }) {
  if (!student) return null;
  const total = quizzes.length;
  const avgAcc = total > 0
    ? Math.round(quizzes.reduce((s, q) => s + (q.score / Math.max(1, q.total_questions)) * 100, 0) / total)
    : 0;

  const bySubject = {};
  quizzes.forEach((q) => {
    const subj = q.subject || "ไม่ระบุ";
    if (!bySubject[subj]) bySubject[subj] = { count: 0, totalScore: 0, totalQ: 0 };
    bySubject[subj].count += 1;
    bySubject[subj].totalScore += q.score || 0;
    bySubject[subj].totalQ += q.total_questions || 0;
  });
  const subjectEntries = Object.entries(bySubject).sort((a, b) => b[1].count - a[1].count);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>สถิตินักเรียน</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {student.student_name?.charAt(0) || "?"}
            </div>
            <div>
              <p className="font-semibold">{student.student_name}</p>
              <p className="text-xs text-muted-foreground">
                รหัส {student.student_code}{student.department ? ` · ${student.department}` : ""}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-muted/50">
              <Award className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold">{total}</p>
              <p className="text-[10px] text-muted-foreground">ข้อสอบที่ทำ</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50">
              <Target className="w-5 h-5 mx-auto text-accent mb-1" />
              <p className="text-xl font-bold">{avgAcc}%</p>
              <p className="text-[10px] text-muted-foreground">ความแม่นยำเฉลี่ย</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50">
              <BookOpen className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold">{subjectEntries.length}</p>
              <p className="text-[10px] text-muted-foreground">วิชา</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">แยกตามวิชา</p>
            {subjectEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีข้อมูลการทำข้อสอบ</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {subjectEntries.map(([subj, d]) => (
                  <div key={subj} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                    <div>
                      <p className="font-medium text-sm">{subj}</p>
                      <p className="text-xs text-muted-foreground">{d.count} ครั้ง · {d.totalScore}/{d.totalQ} ข้อ</p>
                    </div>
                    <Badge variant="outline">
                      {d.totalQ > 0 ? Math.round((d.totalScore / d.totalQ) * 100) : 0}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}