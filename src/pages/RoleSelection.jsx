import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { GraduationCap, Building2, ArrowRight } from "lucide-react";

export default function RoleSelection() {
  const navigate = useNavigate();

  useEffect(() => {
    // ถ้า login อยู่แล้ว ไม่ต้องเลือก role ซ้ำ
    if (localStorage.getItem("selectedRole")) {
      // ไม่ auto-redirect เพื่อให้เปลี่ยน role ได้
    }
  }, []);

  const choose = (role) => {
    localStorage.setItem("selectedRole", role);
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-4xl">🦖</span>
            <h1 className="text-3xl font-display font-bold">DINOTutor</h1>
          </div>
          <p className="text-muted-foreground">เลือกสถานะของคุณเพื่อเข้าสู่ระบบ</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card
              className="p-8 border-0 shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all h-full"
              onClick={() => choose("student")}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <GraduationCap className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-display font-bold mb-2">นักเรียน</h2>
              <p className="text-sm text-muted-foreground mb-5">
                เข้าถึงการฝึกโจทย์ สอบจัดระดับ ต่อสู้กับเพื่อน และ AI ผู้ช่วยเรียนรู้ส่วนตัว
              </p>
              <div className="flex items-center gap-1 text-primary text-sm font-semibold">
                เข้าสู่ระบบ <ArrowRight className="w-4 h-4" />
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
            <Card
              className="p-8 border-0 shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all h-full"
              onClick={() => choose("teacher")}
            >
              <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mb-4">
                <Building2 className="w-7 h-7 text-accent" />
              </div>
              <h2 className="text-xl font-display font-bold mb-2">ครู / สถาบัน</h2>
              <p className="text-sm text-muted-foreground mb-5">
                ดูสถิตินักเรียนในสถาบัน ติดตามความก้าวหน้า และจัดการคลังข้อสอบผ่าน Dashboard
              </p>
              <div className="flex items-center gap-1 text-accent text-sm font-semibold">
                เข้าสู่ระบบ <ArrowRight className="w-4 h-4" />
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}