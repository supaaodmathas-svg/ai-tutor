import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";
import { TEACHING_SUBJECTS } from "@/lib/teachingSchedule";

export default function TeachingSubjectSelection() {
  const { checkUserAuth } = useAuth();
  const [loading, setLoading] = useState(null);

  const choose = async (subject) => {
    if (loading) return;
    setLoading(subject);
    try {
      await base44.auth.updateMe({ teaching_subject: subject });
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
        <h1 className="text-2xl font-display font-bold">คุณสอนวิชาอะไร?</h1>
        <p className="text-sm text-muted-foreground mt-1">เลือกวิชาที่คุณสอนเพื่อดูห้องและตารางคาบสอนของคุณ</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TEACHING_SUBJECTS.map((subject, i) => (
          <motion.div key={subject} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card
              className="p-4 border-2 border-border shadow cursor-pointer hover:border-primary hover:shadow-md transition-all h-full flex flex-col items-center justify-center text-center"
              onClick={() => choose(subject)}
            >
              <p className="font-display font-bold text-sm mb-2">{subject}</p>
              {loading === subject ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <ArrowRight className="w-4 h-4 text-primary" />
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}