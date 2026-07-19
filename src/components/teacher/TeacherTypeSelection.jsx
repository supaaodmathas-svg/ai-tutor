import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { School, BookOpenCheck, ArrowRight, Loader2 } from "lucide-react";

export default function TeacherTypeSelection() {
  const { checkUserAuth } = useAuth();
  const [loading, setLoading] = useState(null);

  const choose = async (type) => {
    if (loading) return;
    setLoading(type);
    try {
      // เริ่มใหม่เมื่อเปลี่ยนประเภทสถาบัน
      await base44.auth.updateMe({
        teacher_institution_type: type,
        teacher_institution_id: null,
        teaching_subject: null,
      });
      await checkUserAuth();
    } catch (e) {
      alert(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pt-2">
      <div className="text-center">
        <h1 className="text-2xl font-display font-bold">คุณเป็นครูจากสถาบันแบบไหน?</h1>
        <p className="text-sm text-muted-foreground mt-1">เลือกเพื่อปรับแดชบอร์ดให้เหมาะกับสถาบันของคุณ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Card
            className="p-7 border-0 shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all h-full"
            onClick={() => choose("school")}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <School className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-display font-bold mb-2">สถาบันศึกษา</h2>
            <p className="text-sm text-muted-foreground mb-5">
              โรงเรียน — เลือกวิชาที่สอน ดูห้องเรียนและตารางสอนของคุณ
            </p>
            <div className="flex items-center gap-1 text-primary text-sm font-semibold">
              {loading === "school" ? <Loader2 className="w-4 h-4 animate-spin" /> : <>เลือก <ArrowRight className="w-4 h-4" /></>}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
          <Card
            className="p-7 border-0 shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all h-full"
            onClick={() => choose("tutoring")}
          >
            <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mb-4">
              <BookOpenCheck className="w-7 h-7 text-accent" />
            </div>
            <h2 className="text-xl font-display font-bold mb-2">สถาบันกวดวิชา</h2>
            <p className="text-sm text-muted-foreground mb-5">
              ติวเตอร์ — ดูรายชื่อนักเรียน สถิติ และคลังข้อสอบของสถาบัน
            </p>
            <div className="flex items-center gap-1 text-accent text-sm font-semibold">
              {loading === "tutoring" ? <Loader2 className="w-4 h-4 animate-spin" /> : <>เลือก <ArrowRight className="w-4 h-4" /></>}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}