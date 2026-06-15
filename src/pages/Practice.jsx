import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QuizQuestion from "@/components/QuizQuestion";
import SubjectCard from "@/components/SubjectCard";
import { Loader2, CheckCircle, FlaskConical, Zap, RotateCcw, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const subjects = ["คณิตศาสตร์ 1", "คณิตศาสตร์ 2", "ฟิสิกส์", "เคมี", "ชีววิทยา", "ภาษาอังกฤษ", "ภาษาไทย", "สังคมศึกษา"];

export default function Practice() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [numQuestions, setNumQuestions] = useState("5");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const { data: placements = [] } = useQuery({
    queryKey: ["my-placements"],
    queryFn: () => base44.entities.PlacementTest.filter({ completed: true }),
  });

  const getLevel = (subject) => {
    const p = placements.find((p) => p.subject === subject);
    return p?.result_level || 3;
  };

  // Adaptive: ดึงข้อสอบล่าสุดเพื่อปรับระดับ
  const { data: recentQuizzes = [] } = useQuery({
    queryKey: ["recent-quizzes-adaptive"],
    queryFn: () => base44.entities.Quiz.filter({ completed: true }, "-created_date", 3),
  });

  const getAdaptiveLevel = (subject) => {
    const baseLevel = getLevel(subject);
    const recent = recentQuizzes.filter(q => q.subject === subject).slice(0, 3);
    if (recent.length === 0) return baseLevel;

    const avgScore = recent.reduce((a, q) => a + (q.score / q.total_questions), 0) / recent.length;
    if (avgScore >= 0.8 && baseLevel < 5) return Math.min(baseLevel + 1, 5);
    if (avgScore <= 0.4 && baseLevel > 1) return Math.max(baseLevel - 1, 1);
    return baseLevel;
  };

  const startQuiz = async () => {
    if ((user?.tokens ?? 50) < 1) {
      toast({ title: "Token ไม่เพียงพอ", description: "กรุณาเติม Token เพื่อทำข้อสอบ", variant: "destructive" });
      return;
    }

    setLoading(true);
    const level = getAdaptiveLevel(selectedSubject);
    const count = parseInt(numQuestions);
    const tokenCost = Math.ceil(count / 5);

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `สร้างข้อสอบวิชา ${selectedSubject} สำหรับนักเรียนระดับมัธยมปลาย จำนวน ${count} ข้อ
ระดับความยาก: ${level}/5 (Adaptive Learning)
- ถ้าระดับ ${level} ให้ข้อสอบกระจายรอบๆ ระดับนั้น (±1)
- ข้อสอบต้องหลากหลายหัวข้อ ไม่ซ้ำกัน
- แต่ละข้อมี 4 ตัวเลือก
- เนื้อหาเป็นภาษาไทย ตรงหลักสูตร`,
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
      add_context_from_internet: true,
    });

    // หัก token
    await base44.auth.updateMe({ tokens: (user?.tokens ?? 50) - tokenCost });

    setQuestions(res.questions || []);
    setAnswers(new Array(count).fill(-1));
    setCurrentIndex(0);
    setResult(null);
    setShowExplanation(false);
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
    const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct_answer ? 1 : 0), 0);
    const quizResult = {
      subject: selectedSubject,
      difficulty_level: getAdaptiveLevel(selectedSubject),
      questions,
      user_answers: answers,
      score,
      total_questions: questions.length,
      completed: true,
      quiz_type: "practice",
    };
    await base44.entities.Quiz.create(quizResult);
    setResult(quizResult);
    setShowExplanation(true);
    setCurrentIndex(0);
  };

  const reset = () => {
    setSelectedSubject(null);
    setQuestions([]);
    setResult(null);
    setShowExplanation(false);
  };

  if (!selectedSubject) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">ฝึกทำข้อสอบ</h1>
              <p className="text-sm text-muted-foreground">
                AI จะสร้างข้อสอบตามระดับของคุณ (ใช้ Token)
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {subjects.map((subject, i) => (
            <motion.div
              key={subject}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <SubjectCard
                subject={subject}
                level={getAdaptiveLevel(subject)}
                showLevel
                onClick={() => setSelectedSubject(subject)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-lg font-heading font-semibold">กำลังสร้างข้อสอบ...</p>
        <p className="text-sm text-muted-foreground mt-1">
          Adaptive Level: {getAdaptiveLevel(selectedSubject)}
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Card className="p-6 border-0 shadow-lg">
          <h2 className="text-xl font-display font-bold mb-4">{selectedSubject}</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">จำนวนข้อ</label>
              <Select value={numQuestions} onValueChange={setNumQuestions}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 ข้อ (1 Token)</SelectItem>
                  <SelectItem value="10">10 ข้อ (2 Tokens)</SelectItem>
                  <SelectItem value="20">20 ข้อ (4 Tokens)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 text-sm">
              <div className="flex items-center justify-between">
                <span>ระดับ Adaptive</span>
                <Badge>Level {getAdaptiveLevel(selectedSubject)}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ระดับจะปรับตามผลคะแนนล่าสุดของคุณ
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={reset} className="flex-1">
                ← กลับ
              </Button>
              <Button onClick={startQuiz} className="flex-1">
                <Zap className="w-4 h-4 mr-2" />
                เริ่มทำข้อสอบ
              </Button>
            </div>
          </div>
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
              {result.score}/{result.total_questions}
            </p>
            <p className="text-muted-foreground mb-6">
              {Math.round((result.score / result.total_questions) * 100)}% ถูกต้อง
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={reset} variant="outline" className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                ทำใหม่
              </Button>
              <Button onClick={() => { setCurrentIndex(0); }} className="flex-1">
                ดูเฉลย →
              </Button>
            </div>
          </Card>
        </motion.div>

        {showExplanation && questions.map((q, i) => (
          <QuizQuestion
            key={i}
            question={q}
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
          <h1 className="text-xl font-display font-bold">{selectedSubject}</h1>
          <p className="text-sm text-muted-foreground">Level {getAdaptiveLevel(selectedSubject)} • Adaptive</p>
        </div>
      </div>

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
          ← ก่อนหน้า
        </Button>
        {currentIndex < questions.length - 1 ? (
          <Button onClick={() => setCurrentIndex(currentIndex + 1)}>
            ถัดไป →
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={answers.includes(-1)}
            className="bg-gradient-to-r from-primary to-accent">
            <CheckCircle className="w-4 h-4 mr-2" />
            ส่งคำตอบ
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