import React from "react";
import { useNavigate } from "react-router-dom";
import SubjectCard from "@/components/SubjectCard";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const subjects = [
"คณิตศาสตร์",
"วิทยาศาสตร์",
"คณิตศาสตร์ 1",
"คณิตศาสตร์ 2",
"ฟิสิกส์",
"เคมี",
"ชีววิทยา",
"ภาษาอังกฤษ",
"ภาษาไทย",
"สังคมศึกษา"];


export default function Subjects() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">ทดสอบระดับวิชา</h1>
            <p className="text-sm text-muted-foreground">เลือกวิชาเพื่อทำ Placement Test (ฟรี ไม่ใช้ Token)</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {subjects.map((subject, i) =>
        <motion.div
          key={subject}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}>
          
            <SubjectCard
            subject={subject}
            onClick={() => navigate(`/placement-test?subject=${encodeURIComponent(subject)}`)} />
          
          </motion.div>
        )}
      </div>
    </div>);

}