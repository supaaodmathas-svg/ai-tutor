import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Compass, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PATH_OPTIONS = [
  "วิทยาศาสตร์-คณิตศาสตร์", "คณิตศาสตร์-คอมพิวเตอร์", "ศิลปศาสตร์-คำนวณ",
  "ศิลปศาสตร์-ภาษา", "ศิลปกรรมศาสตร์", "ดนตรี/ศิลปะการแสดง",
  "วิศวกรรม/เทคโนโลยี", "แพทย์/สาธารณสุข", "ครุศาสตร์/ศึกษาศาสตร์",
  "การจัดการ/บริหารธุรกิจ", "นิติศาสตร์/รัฐศาสตร์", "บัญชี/การเงิน",
  "การเกษตร/สิ่งแวดล้อม", "มนุษยศาสตร์/สังคมศาสตร์", "นิเทศศาสตร์/สื่อสารมวลชน"
];

const STRENGTH_OPTIONS = [
  "คำนวณ/ตัวเลข", "วิเคราะห์/ตรรกะ", "สร้างสรรค์/ออกแบบ", "เขียน/แต่ง",
  "พูด/นำเสนอ", "จดจำ/ท่องจำ", "แก้ปัญหา", "สื่อสาร/ประสานความสัมพันธ์",
  "ความเป็นผู้นำ", "ใส่ใจรายละเอียด", "งานช่าง/ประดิษฐ์", "ภาษา/แปล",
  "คอมพิวเตอร์/เขียนโค้ด", "ดนตรี/ศิลปะ", "กีฬา/ร่างกาย"
];

const HELP_OPTIONS = [
  "การบ้าน/เรียน", "แก้ปัญหาเชิงตรรกะ", "ออกแบบ/ตกแต่ง", "พูด/นำเสนอแทน",
  "วางแผน/จัดตาราง", "แปล/ภาษา", "ใช้คอม/เทคโนโลยี", "ให้คำแนะนำ/ปรึกษา",
  "จัดกิจกรรม", "ช่วยงานบ้าน/งานช่าง"
];

const WORK_STYLES = [
  "ทำงานคนเดียวสงบๆ", "ทำงานเป็นทีม", "ออกแบบ/สร้างสรรค์งานใหม่ๆ",
  "วิเคราะห์ข้อมูล/วิจัย", "พบปะผู้คน/บริการ", "ห้องปฏิบัติการ/ทดลอง",
  "กลางแจ้ง/เดินทาง", "หน้าจอคอมพิวเตอร์"
];

function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
        selected
          ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30"
          : "bg-card text-foreground border-border hover:border-primary/40"
      }`}
    >
      {label}
    </button>
  );
}

function MultiSelect({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Chip
          key={opt}
          label={opt}
          selected={selected.includes(opt)}
          onClick={() => onToggle(opt)}
        />
      ))}
    </div>
  );
}

export default function CareerQuestionnaire({ onSubmit, analyzing }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    preferred_paths: [],
    dream_career: "",
    strengths: [],
    special_abilities: "",
    help_others_with: [],
    favorite_subjects: "",
    work_style: "",
  });

  const toggle = (key, value) => {
    setForm((f) => {
      const arr = f[key];
      return { ...f, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const steps = [
    {
      title: "สายการเรียนที่สนใจ",
      sub: "เลือกได้มากกว่า 1 อย่าง",
      content: (
        <div className="space-y-5">
          <MultiSelect options={PATH_OPTIONS} selected={form.preferred_paths} onToggle={(v) => toggle("preferred_paths", v)} />
          <div>
            <label className="text-sm font-semibold mb-2 block">วิชาที่ชอบที่สุดในโรงเรียน</label>
            <Input
              value={form.favorite_subjects}
              onChange={(e) => setForm({ ...form, favorite_subjects: e.target.value })}
              placeholder="เช่น คณิตศาสตร์, ฟิสิกส์, ภาษาอังกฤษ..."
            />
          </div>
        </div>
      ),
      canNext: form.preferred_paths.length > 0,
    },
    {
      title: "ความฝัน & ความสามารถ",
      sub: "บอกเราเกี่ยวกับตัวเองให้มากขึ้น",
      content: (
        <div className="space-y-5">
          <div>
            <label className="text-sm font-semibold mb-2 block">โตขึ้นอยากเป็นอะไร? ความฝันของคุณคืออะไร?</label>
            <Textarea
              value={form.dream_career}
              onChange={(e) => setForm({ ...form, dream_career: e.target.value })}
              placeholder="เช่น อยากเป็นแพทย์, วิศวกร, นักออกแบบ, เปิดธุรกิจของตัวเอง..."
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">มีความสามารถพิเศษ งานอดิเรก หรือทักษะอะไรบ้าง?</label>
            <Textarea
              value={form.special_abilities}
              onChange={(e) => setForm({ ...form, special_abilities: e.target.value })}
              placeholder="เช่น เล่นกีฬา, เล่นดนตรี, เขียนโค้ด, วาดรูป, แต่งเพลง..."
              rows={3}
            />
          </div>
        </div>
      ),
      canNext: form.dream_career.trim().length > 0 || form.special_abilities.trim().length > 0,
    },
    {
      title: "สิ่งที่ถนัด & การช่วยเหลือ",
      sub: "เลือกได้มากกว่า 1 อย่าง",
      content: (
        <div className="space-y-5">
          <div>
            <label className="text-sm font-semibold mb-2 block">คุณถนัดอะไร?</label>
            <MultiSelect options={STRENGTH_OPTIONS} selected={form.strengths} onToggle={(v) => toggle("strengths", v)} />
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">คนรอบตัวมักขอให้คุณช่วยอะไร?</label>
            <MultiSelect options={HELP_OPTIONS} selected={form.help_others_with} onToggle={(v) => toggle("help_others_with", v)} />
          </div>
        </div>
      ),
      canNext: form.strengths.length > 0 || form.help_others_with.length > 0,
    },
    {
      title: "บรรยากาศการทำงาน",
      sub: "แบบไหนที่ทำให้คุณมีความสุขที่สุด?",
      content: (
        <div className="space-y-3">
          {WORK_STYLES.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setForm({ ...form, work_style: w })}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                form.work_style === w
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30"
                  : "bg-card text-foreground border-border hover:border-primary/40"
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      ),
      canNext: form.work_style.length > 0,
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <Card className="p-6 md:p-8 border-0 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Compass className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold">แบบประเมินสายการเรียน</h2>
          <p className="text-sm text-muted-foreground">ตอบตามความเป็นจริง เพื่อให้ AI วิเคราะห์ได้แม่นยำ</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 mb-6">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="text-lg font-display font-bold mb-1">{current.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{current.sub}</p>
          {current.content}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-8">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || analyzing}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> ย้อนกลับ
        </Button>
        {isLast ? (
          <Button
            onClick={() => onSubmit(form)}
            disabled={!current.canNext || analyzing}
            className="bg-gradient-to-r from-primary to-accent"
          >
            {analyzing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> AI กำลังวิเคราะห์...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> วิเคราะห์ผล</>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            disabled={!current.canNext}
          >
            ถัดไป <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </Card>
  );
}