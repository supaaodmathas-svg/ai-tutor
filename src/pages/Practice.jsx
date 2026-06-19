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
import { Loader2, CheckCircle, FlaskConical, Zap, RotateCcw, BookOpen, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { subjectTopics } from "@/lib/subjectTopics";

const subjects = ["คณิตศาสตร์ 1", "คณิตศาสตร์ 2", "ฟิสิกส์", "เคมี", "ชีววิทยา", "ภาษาอังกฤษ", "ภาษาไทย", "สังคมศึกษา"];
const gradeOptions = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];

export default function Practice() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedTopics, setSelectedTopics] = useState([]);
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
    queryFn: () => base44.entities.PlacementTest.filter({ completed: true, created_by_id: user?.id }),
  });

  const getLevel = (subject) => {
    const p = placements.find((p) => p.subject === subject);
    return p?.result_level || 3;
  };

  const { data: recentQuizzes = [] } = useQuery({
    queryKey: ["recent-quizzes-adaptive"],
    queryFn: () => base44.entities.Quiz.filter({ completed: true, created_by_id: user?.id }, "-created_date", 3),
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
    const topicText = selectedTopics.length > 0 ? `เนื้อหา: ${selectedTopics.join(", ")}` : "";

    const isMath = /คณิตศาสตร์|math|algebra|geometry|calculus|สถิติ|ความน่าจะเป็น/i.test(selectedSubject);
    const isCalculation = /คณิตศาสตร์|ฟิสิกส์|เคมี|สถิติ|ความน่าจะเป็น|statistics|physics|chemistry|mathematics/i.test(selectedSubject);
    const isBioLife = /ชีววิทยา|ชีววิทยา|biology|biology|สัตววิทยา|พืชศาสตร์/i.test(selectedSubject);
    
    const explanationGuide = isCalculation && !isBioLife 
      ? "อธิบายโดยแสดงวิธีทำ ขั้นตอน และหลักการคำนวณ"
      : isBioLife || /เคมี|chemistry/i.test(selectedSubject)
      ? "อธิบายเหตุผลว่าทำไมคำตอบจึงถูก ลักษณะ หลักการทำงาน และความสัมพันธ์ของสิ่งมีชีวิต"
      : "อธิบายเหตุผลและหลักการที่สำคัญ";

    const isAIPro = currentUser?.is_premium || user?.is_premium;
    const quizModel = isAIPro ? "gpt_5_mini" : "gemini_3_1_pro";

    const res = await base44.integrations.Core.InvokeLLM({
      model: quizModel,
      prompt: `สร้างข้อสอบวิชา ${selectedSubject} ${gradeText} ${topicText}
จำนวนข้อสอบ: ${count} ข้อ (ต้องเท่ากับ ${count} พอดี ห้ามมากกว่าหรือน้อยกว่า)
ระดับความยาก: ${level}/5

กฎเข้มงวด:
- ส่งกลับ questions array ที่มีสมาชิก ${count} รายการพอดี ไม่มากไม่น้อย
- ห้ามส่ง ${count + 1} ข้อหรือมากกว่า
- ข้อสอบต้องเกี่ยวกับ${topicText || gradeText}เท่านั้น
- แต่ละข้อมี choices อาร์เรย์ 4 รายการเสมอ (ไม่ใช่ 3 หรือ 5)
- correct_answer คือ index 0, 1, 2, หรือ 3 เท่านั้น
- เนื้อหาภาษาไทย ตรงหลักสูตร ${gradeText}
- explanation: ${explanationGuide}`,
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
      },
    });

    // Hard cap: ห้ามเกินจำนวนที่ผู้ใช้เลือก
    const fetchedQuestions = (res.questions || []).slice(0, count);

    // Save quiz for later retake (free)
    await base44.entities.SavedQuiz.create({
      user_id: user.id,
      subject: selectedSubject,
      grade: selectedGrade,
      difficulty_level: level,
      questions: fetchedQuestions,
      title: `${selectedSubject} ${selectedGrade}${selectedTopics.length > 0 ? ` - ${selectedTopics.join(", ")}` : ""} Lv.${level}`,
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

    // Generate AI study guide
    const wrongQuestions = questions.filter((q, i) => answers[i] !== q.correct_answer);
    setLoadingGuide(true);
    const guideSummary = wrongQuestions.length > 0 
      ? `นักเรียนทำข้อสอบวิชา ${selectedSubject} แล้วตอบผิดในข้อต่อไปนี้:\n${wrongQuestions.map((q, i) => `${i + 1}. ${q.question}`).join("\n")}\n\nกรุณาแนะนำแนวทางแก้ไขเป็นภาษาไทยสำหรับแต่ละข้อ โดยระบุ:\n1. จุดที่ต้องปรับปรุง\n2. บทเรียน/หัวข้อที่ควรทบทวน\n3. เคล็ดลับการจำ\nให้กระชับ เข้าใจง่าย เหมาะสำหรับนักเรียนมัธยม`
      : `นักเรียนทำข้อสอบวิชา ${selectedSubject} ได้ ${result.score}/${result.total_questions} ข้อ กรุณาสร้างแผนการเรียนเพื่อเพิ่มพูนความรู้ให้ลึกขึ้น:\n1. หัวข้อสำคัญที่ควรเรียนเพิ่มเติม\n2. เคล็ดลับการจำและการเข้าใจที่ลึกขึ้น\n3. ข้อแนะนำสำหรับการทดสอบครั้งถัดไป`;
      const isAIPro2 = currentUser?.is_premium || user?.is_premium;
      const guideModel = isAIPro2 ? "gpt_5_mini" : "claude_sonnet_4_6";
      const guideRes = await base44.integrations.Core.InvokeLLM({
      model: guideModel,
      prompt: guideSummary,
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
    setSelectedTopics([]);
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
    const availableGrades = Object.keys(subjectTopics[selectedSubject] || {});
    const availableTopics = selectedGrade ? (subjectTopics[selectedSubject]?.[selectedGrade] || []) : [];

    return (
      <div className="max-w-md mx-auto space-y-6">
        <Card className="p-6 border-0 shadow-lg">
          <h2 className="text-xl font-display font-bold mb-4">{selectedSubject}</h2>
          <div className="space-y-4">

            {/* Step 1: Grade */}
            <div>
              <label className="text-sm font-semibold mb-2 block">📚 ระดับชั้น</label>
              <Select value={selectedGrade} onValueChange={(v) => { setSelectedGrade(v); setSelectedTopics([]); }}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกระดับชั้น" />
                </SelectTrigger>
                <SelectContent>
                  {(availableGrades.length > 0 ? availableGrades : gradeOptions).map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: Topic (multi-select) */}
            {selectedGrade && availableTopics.length > 0 && (
              <div>
                <label className="text-sm font-semibold mb-1 block">📖 เนื้อหาที่ต้องการฝึก</label>
                <p className="text-xs text-muted-foreground mb-2">เลือกได้มากกว่า 1 หัวข้อ (ไม่เลือก = สุ่มทุกเนื้อหา)</p>
                <div className="grid grid-cols-1 gap-2">
                  {availableTopics.map((topic) => {
                    const isSelected = selectedTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        onClick={() => setSelectedTopics(prev =>
                          isSelected ? prev.filter(t => t !== topic) : [...prev, topic]
                        )}
                        className={`text-left px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-foreground hover:border-primary/40"
                        }`}
                      >
                        <span>{topic}</span>
                        {isSelected && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <button
                    onClick={() => setSelectedTopics([...availableTopics])}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    ✓ รวมทุกเนื้อหา
                  </button>
                  <button
                    onClick={() => setSelectedTopics([])}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    ✕ กระจายเนื้อเรื่อง
                  </button>
                  <button
                    onClick={() => {
                      const count = Math.floor(Math.random() * Math.min(3, availableTopics.length)) + 1;
                      const shuffled = [...availableTopics].sort(() => Math.random() - 0.5);
                      setSelectedTopics(shuffled.slice(0, count));
                    }}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    🎲 สุ่มเนื้อหา
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Num Questions */}
            {selectedGrade && (
              <div>
                <label className="text-sm font-semibold mb-2 block">🔢 จำนวนข้อ</label>
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
            )}

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
              <Button onClick={startQuiz} className="flex-1" disabled={!selectedGrade}>
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
            <div className="space-y-4">
              {/* Main Header */}
              <div className="bg-teal-600 text-white rounded-2xl p-5">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">📚 แผนการแก้ไขจาก AI</h3>
              </div>

              {/* Overview */}
              {studyGuide.overall_advice && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-teal-100 p-4 border-b border-gray-200">
                    <p className="text-sm font-bold text-teal-700">🎯 ภาพรวม</p>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-foreground">{studyGuide.overall_advice}</p>
                  </div>
                </div>
              )}

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Topics to Review */}
                {studyGuide.topics_to_review?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="bg-teal-100 p-4 border-b border-gray-200">
                      <p className="text-sm font-bold text-teal-700">📖 บทที่ควรทบทวน</p>
                    </div>
                    <div className="p-5 space-y-2">
                      {studyGuide.topics_to_review.map((t, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                          <span className="text-teal-600 font-bold">•</span>
                          <span className="text-foreground">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Study Tips */}
                {studyGuide.study_tips?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="bg-teal-100 p-4 border-b border-gray-200">
                      <p className="text-sm font-bold text-teal-700">💡 เคล็ดลับการจำ</p>
                    </div>
                    <div className="p-5 space-y-2">
                      {studyGuide.study_tips.map((tip, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                          <span className="text-teal-600 font-bold">•</span>
                          <span className="text-foreground">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Wrong Questions (Expandable) */}
              {studyGuide.per_question?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <details className="group">
                    <summary className="bg-red-50 p-5 cursor-pointer flex items-center justify-between border-b border-gray-200 hover:bg-red-100 transition">
                      <p className="text-sm font-bold text-red-600 flex items-center gap-2">
                        ❌ ข้อที่ทำผิด
                      </p>
                      <svg className="w-5 h-5 text-red-600 transform group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </summary>
                    <div className="p-5 space-y-4">
                      {studyGuide.per_question.map((pq, i) => (
                        <div key={i} className="border-l-4 border-red-400 pl-4 py-2">
                          <p className="text-xs font-bold text-red-600 mb-1">{pq.question_summary}</p>
                          <p className="text-sm text-foreground mb-2">{pq.fix_advice}</p>
                          {pq.chapter_to_read && (
                            <p className="text-xs text-teal-600 font-semibold">📗 {pq.chapter_to_read}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
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