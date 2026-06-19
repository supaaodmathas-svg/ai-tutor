import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QuizQuestion from "@/components/QuizQuestion";
import SubjectCard from "@/components/SubjectCard";
import LevelUpOverlay from "@/components/LevelUpOverlay";
import { Loader2, CheckCircle, FlaskConical, Zap, RotateCcw, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const subjects = ["คณิตศาสตร์ 1", "คณิตศาสตร์ 2", "ฟิสิกส์", "เคมี", "ชีววิทยา", "ภาษาอังกฤษ", "ภาษาไทย", "สังคมศึกษา"];
const gradeOptions = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];

export default function Practice() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [numQuestions, setNumQuestions] = useState("5");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [levelUp, setLevelUp] = useState(null);
  const [studyGuide, setStudyGuide] = useState(null);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [isRetake, setIsRetake] = useState(false);

  // Load saved quiz from URL param (retake — no token cost)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const savedQuizId = params.get("savedQuizId");
    if (!savedQuizId) return;
    const load = async () => {
      setLoading(true);
      const sq = await base44.entities.SavedQuiz.get(savedQuizId);
      if (sq && sq.questions?.length > 0) {
        setSelectedSubject(sq.subject);
        setSelectedGrade(sq.grade || "");
        setQuestions(sq.questions);
        setAnswers(new Array(sq.questions.length).fill(-1));
        setCurrentIndex(0);
        setIsRetake(true);
      }
      setLoading(false);
    };
    load();
  }, []);

  const { data: currentUser } = useQuery({
    queryKey: ["current-user-practice"],
    queryFn: () => base44.auth.me(),
    refetchOnWindowFocus: true,
  });

  const { data: placements = [] } = useQuery({
    queryKey: ["my-placements-practice"],
    queryFn: () => base44.entities.PlacementTest.filter({ completed: true }),
  });

  const getLevel = (subject) => {
    const p = placements.find((p) => p.subject === subject);
    return p?.result_level || 3;
  };

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
    const count = parseInt(numQuestions);
    const tokenCost = count * 10;
    const currentTokens = currentUser?.tokens ?? user?.tokens ?? 0;
    if (currentTokens < tokenCost) {
      toast({ title: "⚠️ Token ไม่เพียงพอ", description: `ต้องใช้ ${tokenCost} Tokens กรุณาเติม Token ก่อน`, variant: "destructive" });
      setTimeout(() => { window.location.href = "/tokens"; }, 2000);
      return;
    }

    setLoading(true);
    const level = getAdaptiveLevel(selectedSubject);

    await base44.auth.updateMe({ tokens: currentTokens - tokenCost });
    queryClient.invalidateQueries({ queryKey: ["current-user-practice"] });

    const gradeText = selectedGrade ? `ระดับชั้น ${selectedGrade}` : "มัธยมศึกษาปีที่ 1-6";

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `สร้างข้อสอบวิชา ${selectedSubject} ${gradeText} จำนวน ${count} ข้อพอดี ห้ามสร้างมากกว่าหรือน้อยกว่า ${count} ข้อ
    ระดับความยาก: ${level}/5 (Adaptive Learning)
    - ข้อสอบต้องตรงตามหลักสูตรชั้น ${gradeText}
    - แต่ละข้อมี 4 ตัวเลือก (choices มี 4 รายการเสมอ)
    - correct_answer คือ index 0-3
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

    const fetchedQuestions = (res.questions || []).slice(0, count);

    // Save quiz for later retake (free)
    await base44.entities.SavedQuiz.create({
      user_id: user.id,
      subject: selectedSubject,
      grade: selectedGrade,
      difficulty_level: level,
      questions: fetchedQuestions,
      title: `${selectedSubject} ${selectedGrade} Lv.${level}`,
    });
    queryClient.invalidateQueries({ queryKey: ["saved-quizzes", user?.id] });

    setQuestions(fetchedQuestions);
    setAnswers(new Array(fetchedQuestions.length).fill(-1));
    setCurrentIndex(0);
    setResult(null);
    setShowExplanation(false);
    setIsRetake(false);
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

    // Generate AI study guide for wrong answers
    const wrongQuestions = questions.filter((q, i) => answers[i] !== q.correct_answer);
    if (wrongQuestions.length > 0) {
      setLoadingGuide(true);
      const wrongSummary = wrongQuestions.map((q, i) => `${i + 1}. ${q.question}`).join("\n");
      const guideRes = await base44.integrations.Core.InvokeLLM({
        prompt: `นักเรียนทำข้อสอบวิชา ${selectedSubject} แล้วตอบผิดในข้อต่อไปนี้:\n${wrongSummary}\n\nกรุณาแนะนำแนวทางแก้ไขเป็นภาษาไทยสำหรับแต่ละข้อ โดยระบุ:\n1. จุดที่ต้องปรับปรุง\n2. บทเรียน/หัวข้อที่ควรทบทวน\n3. เคล็ดลับการจำ\nให้กระชับ เข้าใจง่าย เหมาะสำหรับนักเรียนมัธยม`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_advice: { type: "string" },
            topics_to_review: { type: "array", items: { type: "string" } },
            study_tips: { type: "array", items: { type: "string" } },
            per_question: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question_summary: { type: "string" },
                  fix_advice: { type: "string" },
                  chapter_to_read: { type: "string" }
                }
              }
            }
          }
        }
      });
      setStudyGuide(guideRes);
      setLoadingGuide(false);
    }

    // ---- Per-Subject Level Up ----
    const currentSubjectLevels = user?.subject_levels || {};
    const currentSubjLevel = currentSubjectLevels[selectedSubject] || 1;
    const newSubjLevel = currentSubjLevel + 1;

    // Check if crossed a 10-level threshold
    const oldTens = Math.floor((currentSubjLevel - 1) / 10);
    const newTens = Math.floor((newSubjLevel - 1) / 10);
    const tokensEarned = newTens > oldTens ? 50 : 0;

    const updatedLevels = { ...currentSubjectLevels, [selectedSubject]: newSubjLevel };
    const meUpdate = { subject_levels: updatedLevels };
    if (tokensEarned > 0) {
      meUpdate.tokens = (user?.tokens ?? 0) + tokensEarned;
    }
    await base44.auth.updateMe(meUpdate);
    queryClient.invalidateQueries({ queryKey: ["my-placements-practice"] });

    if (tokensEarned > 0) {
      setLevelUp({ subject: selectedSubject, newLevel: newSubjLevel, tokensEarned });
    } else if (newSubjLevel % 5 === 0) {
      setLevelUp({ subject: selectedSubject, newLevel: newSubjLevel, tokensEarned: 0 });
    }
  };

  const reset = () => {
    setSelectedSubject(null);
    setSelectedGrade("");
    setQuestions([]);
    setResult(null);
    setShowExplanation(false);
    setStudyGuide(null);
    setIsRetake(false);
    // Remove savedQuizId from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("savedQuizId");
    window.history.replaceState({}, "", url.toString());
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
              <label className="text-sm font-medium mb-2 block">ระดับชั้น</label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกระดับชั้น" />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">จำนวนข้อ</label>
              <Select value={numQuestions} onValueChange={setNumQuestions}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 ข้อ (50 Tokens)</SelectItem>
                  <SelectItem value="10">10 ข้อ (100 Tokens)</SelectItem>
                  <SelectItem value="20">20 ข้อ (200 Tokens)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span>ระดับ Adaptive</span>
                <Badge>Level {getAdaptiveLevel(selectedSubject)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>ค่าใช้จ่าย</span>
                <Badge variant="outline">{parseInt(numQuestions) * 10} Tokens</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Token คงเหลือ</span>
                <Badge variant={((currentUser?.tokens ?? user?.tokens ?? 0) >= parseInt(numQuestions) * 10) ? "secondary" : "destructive"}>
                  {currentUser?.tokens ?? user?.tokens ?? 0} Tokens
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">ราคา 10 Tokens ต่อ 1 ข้อ</p>
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
      <>
        {levelUp && (
          <LevelUpOverlay
            subject={levelUp.subject}
            newLevel={levelUp.newLevel}
            tokensEarned={levelUp.tokensEarned}
            onClose={() => setLevelUp(null)}
          />
        )}
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

          {/* AI Study Guide */}
          {loadingGuide && (
            <div className="flex items-center gap-3 p-5 bg-purple-50 border-2 border-purple-200 rounded-3xl">
              <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
              <p className="text-sm font-semibold text-primary">AI กำลังวิเคราะห์และสร้างแผนการเรียน...</p>
            </div>
          )}

          {studyGuide && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-3xl p-6 space-y-5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-lg text-primary">📚 แผนการแก้ไขจาก AI</h3>
              </div>

              {studyGuide.overall_advice && (
                <div className="bg-white rounded-2xl p-4 border border-purple-100">
                  <p className="text-xs font-bold text-muted-foreground mb-1">🎯 ภาพรวม</p>
                  <p className="text-sm text-foreground">{studyGuide.overall_advice}</p>
                </div>
              )}

              {studyGuide.topics_to_review?.length > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-purple-100">
                  <p className="text-xs font-bold text-muted-foreground mb-2">📖 บทที่ควรทบทวน</p>
                  <div className="flex flex-wrap gap-2">
                    {studyGuide.topics_to_review.map((t, i) => (
                      <span key={i} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {studyGuide.per_question?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground">🔍 วิธีแก้ไขรายข้อ</p>
                  {studyGuide.per_question.map((pq, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 border border-pink-100">
                      <p className="text-xs font-bold text-pink-600 mb-1">❌ ข้อที่ทำผิด: {pq.question_summary}</p>
                      <p className="text-sm text-foreground mb-2">{pq.fix_advice}</p>
                      {pq.chapter_to_read && (
                        <p className="text-xs text-blue-600 font-semibold">📗 อ่านเพิ่มเติม: {pq.chapter_to_read}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {studyGuide.study_tips?.length > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-purple-100">
                  <p className="text-xs font-bold text-muted-foreground mb-2">💡 เคล็ดลับการจำ</p>
                  <ul className="space-y-1">
                    {studyGuide.study_tips.map((tip, i) => (
                      <li key={i} className="text-sm text-foreground flex gap-2"><span>•</span>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold">{selectedSubject}</h1>
          <p className="text-sm text-muted-foreground">Level {getAdaptiveLevel(selectedSubject)} • Adaptive</p>
        </div>
        {isRetake && (
          <Badge className="bg-green-100 text-green-700 border-green-200">♻️ ทำซ้ำ ฟรี</Badge>
        )}
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
          <Button onClick={handleSubmit}
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