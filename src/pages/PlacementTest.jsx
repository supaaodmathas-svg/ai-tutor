import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import QuizQuestion from "@/components/QuizQuestion";
import { Loader2, CheckCircle, ArrowRight, BookOpen, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { AI_TUTOR_RULES } from "@/lib/aiTutorRules";

export default function PlacementTest() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const subject = urlParams.get("subject") || "คณิตศาสตร์ 1";

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadQuestions();
  }, [subject]);

  const loadQuestions = async () => {
    setLoading(true);

    // Try to load from pre-generated bank first
    const banks = await base44.entities.PlacementTestBank.filter({ subject });

    if (banks && banks.length > 0) {
      // Pick a random bank from available ones
      const randomBank = banks[Math.floor(Math.random() * banks.length)];
      // Shuffle questions within the bank so order differs each time
      const shuffled = [...randomBank.questions].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      setAnswers(new Array(shuffled.length).fill(-1));
    } else {
      // Fallback: generate on-the-fly if no bank exists
      const res = await base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_flash',
        prompt: `${AI_TUTOR_RULES}
สร้างข้อสอบวิชา ${subject} สำหรับระดับมัธยมศึกษาประเทศไทย (ม.1-6) จำนวน 10 ข้อ โดยแบ่งเป็น:
- Level 1 (ง่ายมาก): 2 ข้อ
- Level 2 (ง่าย): 2 ข้อ
- Level 3 (ปานกลาง): 2 ข้อ
- Level 4 (ยาก): 2 ข้อ
- Level 5 (ยากมาก): 2 ข้อ
แต่ละข้อมี 4 ตัวเลือก correct_answer คือ index 0-3 เนื้อหาภาษาไทยตามหลักสูตรแกนกลาง`,
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
                  correct_answer: { type: "number" },
                  explanation: { type: "string" }
                }
              }
            }
          }
        },
      });
      const qs = res.questions || [];
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(-1));
    }

    setLoading(false);
  };

  const handleAnswer = (answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answerIndex;
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    }
  };

  const handleSubmit = async () => {
    setShowResult(true);
    setAnalyzing(true);

    const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct_answer ? 1 : 0), 0);
    const correctByLevel = {};
    questions.forEach((q, i) => {
      if (!correctByLevel[q.level]) correctByLevel[q.level] = { correct: 0, total: 0 };
      correctByLevel[q.level].total++;
      if (answers[i] === q.correct_answer) correctByLevel[q.level].correct++;
    });

    const analysisRes = await base44.integrations.Core.InvokeLLM({
      prompt: `${AI_TUTOR_RULES}
วิเคราะห์ผลสอบวิชา ${subject} ของนักเรียน:
คะแนนรวม: ${score}/10
ผลแต่ละระดับ: ${JSON.stringify(correctByLevel)}
กรุณาวิเคราะห์:
1. ระบุว่าอยู่ในระดับใด (1-5)
2. อธิบายจุดแข็งและจุดอ่อน
3. แนะนำสิ่งที่ควรพัฒนา
ตอบเป็นภาษาไทย อธิบายอย่างเป็นกันเอง`,
      response_json_schema: {
        type: "object",
        properties: {
          level: { type: "number", description: "ระดับ 1-5" },
          analysis: { type: "string", description: "การวิเคราะห์ผลสอบอย่างละเอียด" }
        }
      }
    });

    // Clamp level to 0-5
    const clampedLevel = Math.min(5, Math.max(0, Math.round(analysisRes.level)));

    const resultData = {
      subject,
      questions,
      user_answers: answers,
      score,
      result_level: clampedLevel,
      analysis: analysisRes.analysis,
      completed: true,
    };

    // Find existing placement for this subject (current user)
    const existing = await base44.entities.PlacementTest.filter({ subject, completed: true });
    if (existing.length > 0) {
      await base44.entities.PlacementTest.update(existing[0].id, {
        result_level: clampedLevel,
        score,
        analysis: analysisRes.analysis,
        user_answers: answers,
        questions,
      });
    } else {
      await base44.entities.PlacementTest.create(resultData);
    }

    setResult({ ...resultData, level: clampedLevel });
    setAnalyzing(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-lg font-heading font-semibold">กำลังโหลดข้อสอบ...</p>
        <p className="text-sm text-muted-foreground mt-1">วิชา {subject}</p>
      </div>
    );
  }

  if (result) {
    const levelLabels = {
      1: "เริ่มต้น", 2: "พื้นฐาน", 3: "ปานกลาง", 4: "ดี", 5: "ยอดเยี่ยม"
    };
    const levelColors = {
      1: "from-red-500 to-orange-500",
      2: "from-orange-500 to-amber-500",
      3: "from-amber-500 to-yellow-500",
      4: "from-green-500 to-emerald-500",
      5: "from-blue-500 to-indigo-500",
    };

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-8 border-0 shadow-xl text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">ผลการวัดระดับ</h1>
            <p className="text-muted-foreground mb-6">วิชา {subject}</p>

            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r ${levelColors[result.level]} text-white mb-6`}>
              <span className="text-4xl font-display font-bold">{result.level}</span>
              <div className="text-left">
                <p className="text-sm font-medium opacity-90">ระดับ</p>
                <p className="text-lg font-bold">{levelLabels[result.level]}</p>
              </div>
            </div>

            <div className="flex justify-center gap-8 mb-6">
              <div>
                <p className="text-3xl font-display font-bold">{result.score}</p>
                <p className="text-xs text-muted-foreground">คะแนน</p>
              </div>
              <div className="w-px bg-border" />
              <div>
                <p className="text-3xl font-display font-bold">10</p>
                <p className="text-xs text-muted-foreground">ข้อทั้งหมด</p>
              </div>
              <div className="w-px bg-border" />
              <div>
                <p className="text-3xl font-display font-bold">{result.score * 10}%</p>
                <p className="text-xs text-muted-foreground">ถูกต้อง</p>
              </div>
            </div>

            <div className="text-left bg-secondary/50 rounded-xl p-5 mb-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                🧠 การวิเคราะห์จาก AI
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.analysis}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => navigate("/practice")} className="flex-1">
                <ArrowRight className="w-4 h-4 mr-2" />
                ฝึกทำข้อสอบต่อ
              </Button>
              <Button variant="outline" onClick={() => navigate("/subjects")} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                ทดสอบวิชาอื่น
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">Placement Test</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{subject}</p>
            <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">ฟรี</Badge>
          </div>
        </div>
      </div>

      {questions.length > 0 && (
        <>
          <QuizQuestion
            question={questions[currentIndex]}
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
              ← ข้อก่อนหน้า
            </Button>

            {currentIndex < questions.length - 1 ? (
              <Button onClick={() => setCurrentIndex(currentIndex + 1)}>
                ข้อถัดไป →
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={answers.includes(-1)}
                className="bg-gradient-to-r from-primary to-accent"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังวิเคราะห์...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    ส่งคำตอบ
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Question dots */}
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
        </>
      )}
    </div>
  );
}