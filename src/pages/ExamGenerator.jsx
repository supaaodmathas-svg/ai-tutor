import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileText, Image, CheckCircle, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { AI_TUTOR_RULES } from "@/lib/aiTutorRules";

const EXAM_TYPES = [
  { value: "mc4", label: "ปรนัย 4 ตัวเลือก" },
  { value: "mc5", label: "ปรนัย 5 ตัวเลือก" },
  { value: "truefalse", label: "ถูก / ผิด" },
  { value: "fillin", label: "เติมคำ" },
  { value: "essay", label: "อัตนัย" },
  { value: "mixed", label: "แบบผสม" },
];

const DIFFICULTY_LEVELS = [
  { value: "1", label: "ง่าย" },
  { value: "2", label: "ปานกลาง-ง่าย" },
  { value: "3", label: "ปานกลาง" },
  { value: "4", label: "ยาก" },
  { value: "5", label: "ยากมาก" },
];

const STEPS = ["upload", "analyze", "configure", "quiz", "result"];

function UploadZone({ onFileSelect, uploading }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"
      }`}
    >
      <input ref={inputRef} type="file" className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.md,.doc,.docx"
        onChange={(e) => e.target.files[0] && onFileSelect(e.target.files[0])} />
      {uploading ? (
        <>
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-semibold text-muted-foreground">กำลังอัปโหลด...</p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือก</p>
            <p className="text-sm text-muted-foreground mt-1">รองรับ PDF, รูปภาพ, TXT, DOC</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {["📄 PDF", "🖼️ รูปภาพ", "📝 TXT", "📋 ชีทสรุป", "📖 โน้ต"].map(t => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">{t}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TopicDistribution({ topics }) {
  const total = topics.reduce((a, t) => a + t.count, 0);
  const colors = ["bg-primary", "bg-accent", "bg-amber-500", "bg-purple-500", "bg-pink-500", "bg-teal-500"];
  return (
    <div className="space-y-2">
      {topics.map((t, i) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{t.name}</span>
            <span className="text-muted-foreground">{t.count} ข้อ ({Math.round((t.count / total) * 100)}%)</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(t.count / total) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.08 }}
              className={`h-full rounded-full ${colors[i % colors.length]}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

function QuestionCard({ question, index, total, selectedAnswer, onAnswer, showResult }) {
  const [expanded, setExpanded] = useState(false);
  const isObjective = ["mc4", "mc5", "truefalse"].includes(question.type);
  const choices = question.choices || [];

  const getChoiceStyle = (i) => {
    if (!showResult) {
      return selectedAnswer === i ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40 bg-card";
    }
    if (i === question.correct_answer) return "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400";
    if (i === selectedAnswer && i !== question.correct_answer) return "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-600";
    return "border-border bg-card text-muted-foreground";
  };

  return (
    <Card className="p-5 border-0 shadow-md">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 flex-1">
          <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">{index + 1}</span>
          <p className="text-sm font-medium leading-relaxed">{question.question}</p>
        </div>
        <Badge variant="outline" className="text-xs flex-shrink-0">{question.difficulty_label || `Lv.${question.difficulty}`}</Badge>
      </div>

      {isObjective && choices.length > 0 && (
        <div className="space-y-2">
          {choices.map((c, i) => (
            <button key={i} disabled={showResult}
              onClick={() => !showResult && onAnswer(index, i)}
              className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${getChoiceStyle(i)}`}>
              <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{c}
            </button>
          ))}
        </div>
      )}

      {question.type === "fillin" && (
        <div className="p-3 rounded-xl bg-muted text-sm text-muted-foreground">
          {showResult ? <span>คำตอบ: <strong className="text-foreground">{question.answer}</strong></span> : <em>เติมคำในช่องว่าง</em>}
        </div>
      )}

      {question.type === "essay" && (
        <div className="p-3 rounded-xl bg-muted text-sm text-muted-foreground">
          {showResult ? <span>แนวคำตอบ: <strong className="text-foreground">{question.answer}</strong></span> : <em>อัตนัย — เขียนตอบด้วยตนเอง</em>}
        </div>
      )}

      {showResult && question.explanation && (
        <div className="mt-3 pt-3 border-t border-border">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            คำอธิบาย
          </button>
          {expanded && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-foreground">{question.explanation}</p>
              {question.source_ref && (
                <p className="text-xs text-muted-foreground">📌 อ้างอิง: {question.source_ref}</p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function ExamGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState("upload"); // upload | analyze | configure | quiz | result
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [analysis, setAnalysis] = useState(null); // { subject, topics, difficulty, summary }

  const [numQuestions, setNumQuestions] = useState("10");
  const [examType, setExamType] = useState("mc4");
  const [difficulty, setDifficulty] = useState("3");

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const FREE_USES = 2;
  const usesCount = user?.exam_gen_uses ?? 0;
  const isFree = usesCount < FREE_USES;
  const TOKEN_COST = 50;

  const handleFileSelect = async (file) => {
    setUploading(true);
    setFileName(file.name);
    setFileType(file.type);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(file_url);
      setUploading(false);
      setStep("analyze");
      await analyzeContent(file_url, file.type, file.name);
    } catch (e) {
      toast({ title: "เกิดข้อผิดพลาด", description: "อัปโหลดไฟล์ไม่สำเร็จ", variant: "destructive" });
      setUploading(false);
    }
  };

  const analyzeContent = async (url, type, name) => {
    setAnalyzing(true);
    const isImage = type.startsWith("image/");
    const res = await base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      prompt: `${AI_TUTOR_RULES}
วิเคราะห์เนื้อหาในไฟล์นี้ (ชื่อไฟล์: ${name})
จงระบุ:
1. วิชาหรือหัวข้อหลักของเนื้อหา
2. หัวข้อย่อยสำคัญที่พบ (3-8 หัวข้อ)
3. ระดับความยากของเนื้อหา (1-5)
4. สรุปสาระสำคัญของเนื้อหาโดยย่อ (2-3 ประโยค)
ตอบเป็นภาษาไทย`,
      file_urls: [url],
      response_json_schema: {
        type: "object",
        properties: {
          subject: { type: "string" },
          topics: { type: "array", items: { type: "string" } },
          difficulty: { type: "number" },
          summary: { type: "string" },
        }
      }
    });
    setAnalysis(res);
    setAnalyzing(false);
    setStep("configure");
  };

  const generateExam = async () => {
    const count = parseInt(numQuestions);
    const currentTokens = user?.tokens ?? 0;
    if (!isFree && currentTokens < TOKEN_COST) {
      toast({ title: "⚠️ Token ไม่เพียงพอ", description: `ต้องใช้ ${TOKEN_COST} Tokens`, variant: "destructive" });
      setTimeout(() => { window.location.href = "/tokens"; }, 2000);
      return;
    }

    setGenerating(true);

    if (isFree) {
      await base44.auth.updateMe({ exam_gen_uses: usesCount + 1 });
    } else {
      await base44.auth.updateMe({ tokens: currentTokens - TOKEN_COST, exam_gen_uses: usesCount + 1 });
    }

    const typeInstructions = {
      mc4: `ปรนัย 4 ตัวเลือก (choices: 4 รายการ, correct_answer: index 0-3)`,
      mc5: `ปรนัย 5 ตัวเลือก (choices: 5 รายการ, correct_answer: index 0-4)`,
      truefalse: `ถูก/ผิด (choices: ["ถูก", "ผิด"], correct_answer: 0 หรือ 1)`,
      fillin: `เติมคำในช่องว่าง (ไม่มี choices, ใส่ answer เป็น string)`,
      essay: `อัตนัย (ไม่มี choices, ใส่ answer เป็นแนวคำตอบสั้นๆ)`,
      mixed: `แบบผสม (สลับระหว่าง mc4, truefalse, fillin)`,
    };

    const res = await base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      prompt: `${AI_TUTOR_RULES}
สร้างข้อสอบจากเนื้อหาในไฟล์นี้ (อ้างอิงจากเนื้อหาเท่านั้น ห้ามสร้างจากความรู้ภายนอก)
วิชา: ${analysis?.subject}
หัวข้อสำคัญ: ${analysis?.topics?.join(", ")}
จำนวนข้อ: ${count} ข้อ (ต้องเท่ากับ ${count} พอดี)
ระดับความยาก: ${difficulty}/5
รูปแบบ: ${typeInstructions[examType]}

กฎสำคัญ:
- ทุกคำถามต้องอ้างอิงจากเนื้อหาในไฟล์เท่านั้น
- ครอบคลุมหัวข้อต่างๆ ให้ทั่วถึง ไม่ซ้ำซ้อน
- ทุกข้อต้องมี explanation อธิบายเหตุผลที่ถูก
- source_ref ระบุว่าคำตอบอ้างอิงจากส่วนไหนของเนื้อหา`,
      file_urls: [fileUrl],
      response_json_schema: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                topic: { type: "string" },
                difficulty: { type: "number" },
                question: { type: "string" },
                choices: { type: "array", items: { type: "string" } },
                correct_answer: { type: "number" },
                answer: { type: "string" },
                explanation: { type: "string" },
                source_ref: { type: "string" },
              }
            }
          },
          topic_distribution: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                count: { type: "number" }
              }
            }
          }
        }
      }
    });

    const qs = (res.questions || []).slice(0, count).map(q => ({
      ...q,
      difficulty_label: ["", "ง่าย", "ง่าย-ปานกลาง", "ปานกลาง", "ยาก", "ยากมาก"][q.difficulty] || "",
    }));

    await base44.entities.SavedQuiz.create({
      user_id: user.id,
      subject: analysis?.subject || "จากไฟล์",
      grade: "",
      difficulty_level: parseInt(difficulty),
      questions: qs,
      title: `📄 ${fileName} — ${qs.length} ข้อ`,
    });
    queryClient.invalidateQueries({ queryKey: ["saved-quizzes", user?.id] });

    setQuestions(qs);
    setAnswers({});
    setResult(null);
    setGenerating(false);
    setStep("quiz");
  };

  const handleAnswer = (qIndex, answerIndex) => {
    setAnswers(prev => ({ ...prev, [qIndex]: answerIndex }));
  };

  const handleSubmit = () => {
    const objectiveQs = questions.filter(q => ["mc4", "mc5", "truefalse"].includes(q.type));
    const correct = objectiveQs.filter((q, i) => answers[questions.indexOf(q)] === q.correct_answer).length;
    setResult({ score: correct, total: objectiveQs.length, allTotal: questions.length });
    setStep("result");
  };

  const reset = () => {
    setStep("upload");
    setFileUrl(null); setFileName(""); setFileType("");
    setAnalysis(null); setQuestions([]); setAnswers({}); setResult(null);
  };

  // ---- RENDER ----

  if (step === "upload") return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">AI Exam Generator</h1>
            <p className="text-sm text-muted-foreground">อัปโหลดเอกสาร → AI สร้างข้อสอบจากเนื้อหา</p>
          </div>
        </div>
      </motion.div>
      <UploadZone onFileSelect={handleFileSelect} uploading={uploading} />
    </div>
  );

  if (step === "analyze") return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </motion.div>
      <div className="text-center">
        <p className="text-lg font-display font-bold">AI กำลังวิเคราะห์เนื้อหา...</p>
        <p className="text-sm text-muted-foreground mt-1">{fileName}</p>
        <div className="flex flex-col gap-1 mt-4 text-sm text-muted-foreground">
          {["📖 อ่านและวิเคราะห์เนื้อหา", "🔍 ระบุหัวข้อสำคัญ", "📊 ตรวจสอบระดับความยาก", "🎯 สกัดสาระสำคัญ"].map((t, i) => (
            <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.4 }}>{t}</motion.p>
          ))}
        </div>
      </div>
    </div>
  );

  if (step === "configure" && analysis) return (
    <div className="space-y-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-5 border-0 shadow-md bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">✅</span>
            <p className="font-bold text-emerald-700 dark:text-emerald-400">วิเคราะห์เนื้อหาสำเร็จ</p>
          </div>
          <p className="text-sm font-semibold mb-1">📚 วิชา: {analysis.subject}</p>
          <p className="text-sm text-muted-foreground mb-3">{analysis.summary}</p>
          <div className="flex flex-wrap gap-2">
            {(analysis.topics || []).map((t, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">ระดับเนื้อหา: {["", "ง่าย", "ง่าย-ปานกลาง", "ปานกลาง", "ยาก", "ยากมาก"][analysis.difficulty] || analysis.difficulty}</p>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-5 border-0 shadow-md space-y-4">
          <h3 className="font-display font-bold">⚙️ ตั้งค่าข้อสอบ</h3>

          <div>
            <label className="text-sm font-semibold mb-2 block">🔢 จำนวนข้อ</label>
            <Select value={numQuestions} onValueChange={setNumQuestions}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 ข้อ (60 Tokens)</SelectItem>
                <SelectItem value="10">10 ข้อ (120 Tokens)</SelectItem>
                <SelectItem value="20">20 ข้อ (240 Tokens)</SelectItem>
                <SelectItem value="30">30 ข้อ (360 Tokens)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">📝 รูปแบบข้อสอบ</label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXAM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">🎯 ระดับความยาก</label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DIFFICULTY_LEVELS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className={`p-3 rounded-xl text-sm space-y-1 ${isFree ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900" : "bg-secondary/50"}`}>
            {isFree ? (
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">🎉 ฟรี!</span>
                <Badge className="bg-emerald-500 text-white border-0">เหลืออีก {FREE_USES - usesCount} ครั้ง</Badge>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>ค่าใช้จ่าย</span>
                  <Badge variant="outline">{TOKEN_COST} Tokens / ครั้ง</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Token คงเหลือ</span>
                  <Badge variant={(user?.tokens ?? 0) >= TOKEN_COST ? "secondary" : "destructive"}>
                    {user?.tokens ?? 0} Tokens
                  </Badge>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={reset} className="flex-1">← อัปโหลดใหม่</Button>
            <Button onClick={generateExam} disabled={generating} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />กำลังสร้าง...</> : <>✨ สร้างข้อสอบ</>}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );

  if (step === "quiz" && questions.length > 0) return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold">📄 {analysis?.subject || fileName}</h1>
          <p className="text-sm text-muted-foreground">{questions.length} ข้อ จากเนื้อหาที่อัปโหลด</p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">จากไฟล์</Badge>
      </div>

      {questions.map((q, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
          <QuestionCard question={q} index={i} total={questions.length}
            selectedAnswer={answers[i]} onAnswer={handleAnswer} showResult={false} />
        </motion.div>
      ))}

      <Button onClick={handleSubmit} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600">
        <CheckCircle className="w-4 h-4 mr-2" />
        ส่งคำตอบ & ดูเฉลย
      </Button>
    </div>
  );

  if (step === "result" && result) return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="p-8 border-0 shadow-xl text-center">
          <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
          <h1 className="text-xl font-display font-bold mb-1">เสร็จแล้ว!</h1>
          {result.total > 0 && (
            <>
              <p className="text-4xl font-display font-bold text-primary mb-1">{result.score}/{result.total}</p>
              <p className="text-muted-foreground">{Math.round((result.score / result.total) * 100)}% ถูกต้อง (ปรนัย)</p>
            </>
          )}
          <Button onClick={reset} variant="outline" className="mt-5 w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            สร้างข้อสอบใหม่
          </Button>
        </Card>
      </motion.div>

      {questions.map((q, i) => (
        <QuestionCard key={i} question={q} index={i} total={questions.length}
          selectedAnswer={answers[i]} onAnswer={() => {}} showResult={true} />
      ))}
    </div>
  );

  return null;
}