import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import QuizQuestion from "@/components/QuizQuestion";
import { Loader2, CheckCircle, RotateCcw, Sparkles, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const NUM_QUESTIONS = 5;

export default function CourseQuiz({ course, onBack }) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState(null);

  const startQuiz = async () => {
    setLoading(true);
    const bank = course.exam_bank || [];
    const bankText = bank.length > 0
      ? bank.map((q, i) =>
          `ข้อ ${i + 1}: ${q.question}\nตัวเลือก: ${(q.choices || []).join(" | ")}\nคำตอบที่ถูก: ${q.choices?.[q.correct_answer] ?? "-"}\nคำอธิบาย: ${q.explanation || "-"}`
        ).join("\n\n")
      : "(ยังไม่มีข้อสอบตัวอย่าง — ให้สร้างข้อสอบตามวิชานี้)";

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `คุณเป็น AI ผู้ช่วยสร้างข้อสอบสำหรับนักเรียนของสถาบัน
Course: "${course.title}"
วิชา: ${course.subject}
${course.grade_level ? `ระดับชั้น: ${course.grade_level}` : ""}

นี่คือข้อสอบตัวอย่างจากฐานข้อมูลของสถาบัน:
${bankText}

ให้คุณนำ concept/เนื้อหาจากข้อสอบตัวอย่างข้างต้นมา "ปรับปรุงให้ดีขึ้น" — ชัดเจน เข้าใจง่าย ครอบคลุม มีคำอธิบายที่เป็นประโยชน์ และสร้างข้อสอบใหม่ ${NUM_QUESTIONS} ข้อที่อ้างอิง concept เดียวกัน

กฎเข้มงวด:
- ส่งกลับ questions array ที่มี ${NUM_QUESTIONS} รายการพอดี
- แต่ละข้อมี choices 4 รายการเสมอ
- correct_answer คือ index 0-3
- เนื้อหาภาษาไทย ตรงกับหลักสูตร
- explanation อธิบายเหตุผลและหลักการที่สำคัญ`,
      response_json_schema: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            minItems: NUM_QUESTIONS,
            maxItems: NUM_QUESTIONS,
            items: {
              type: "object",
              properties: {
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

    setQuestions((res.questions || []).slice(0, NUM_QUESTIONS));
    setAnswers(new Array(NUM_QUESTIONS).fill(-1));
    setCurrentIndex(0);
    setResult(null);
    setLoading(false);
  };

  const handleAnswer = (answerIndex) => {
    const next = [...answers];
    next[currentIndex] = answerIndex;
    setAnswers(next);
    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 250);
    }
  };

  const handleSubmit = () => {
    const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct_answer ? 1 : 0), 0);
    setResult({ score, total: questions.length });
  };

  const reset = () => {
    setQuestions([]);
    setAnswers([]);
    setResult(null);
    setCurrentIndex(0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-lg font-heading font-semibold">AI กำลังปรับปรุงข้อสอบจากสถาบัน...</p>
        <p className="text-sm text-muted-foreground mt-1">ดึงจาก exam bank ของ {course.title}</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> กลับไปยัง Course
        </button>
        <Card className="p-8 border-0 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold">{course.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{course.subject}{course.grade_level ? ` · ${course.grade_level}` : ""}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            AI จะดึงข้อสอบตัวอย่างจากฐานข้อมูลของสถาบันมาปรับปรุงให้ดีขึ้น เป็นข้อสอบ {NUM_QUESTIONS} ข้อให้คุณฝึก
          </p>
          <Button onClick={startQuiz} className="w-full bg-gradient-to-r from-primary to-accent">
            <Sparkles className="w-4 h-4 mr-2" />
            เริ่มฝึกข้อสอบ AI
          </Button>
        </Card>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-8 border-0 shadow-xl text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-display font-bold mb-2">ทำเสร็จแล้ว!</h1>
            <p className="text-4xl font-display font-bold text-primary mb-1">
              {result.score}/{result.total}
            </p>
            <p className="text-muted-foreground mb-6">
              {Math.round((result.score / result.total) * 100)}% ถูกต้อง
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={reset} variant="outline" className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" /> ฝึกใหม่
              </Button>
              <Button onClick={onBack} className="flex-1">กลับไปยัง Course</Button>
            </div>
          </Card>
        </motion.div>

        {questions.map((q, i) => (
          <QuizQuestion
            key={i}
            question={{ ...q, level: course.grade_level ? 3 : 3 }}
            index={i}
            total={questions.length}
            selectedAnswer={answers[i]}
            onAnswer={() => {}}
            showResult
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold">{course.title}</h1>
          <p className="text-sm text-muted-foreground">{course.subject}</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20">AI Colab</Badge>
      </div>

      <QuizQuestion
        question={{ ...questions[currentIndex], level: 3 }}
        index={currentIndex}
        total={questions.length}
        selectedAnswer={answers[currentIndex]}
        onAnswer={handleAnswer}
      />

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          ← ก่อนหน้า
        </Button>
        {currentIndex < questions.length - 1 ? (
          <Button onClick={() => setCurrentIndex(currentIndex + 1)}>ถัดไป →</Button>
        ) : (
          <Button onClick={handleSubmit} className="bg-gradient-to-r from-primary to-accent">
            <CheckCircle className="w-4 h-4 mr-2" /> ส่งคำตอบ
          </Button>
        )}
      </div>

      <div className="flex justify-center gap-2 flex-wrap">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
              i === currentIndex
                ? "bg-primary text-primary-foreground shadow-lg"
                : answers[i] !== -1
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}