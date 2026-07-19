import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// วิชาที่เป็นเนื้อหาสอบ A-Level (MyTCAS / ทปอ.)
const aLevelSubjects = [
  "คณิตศาสตร์ 1",
  "คณิตศาสตร์ 2",
  "ฟิสิกส์",
  "เคมี",
  "ชีววิทยา",
  "ภาษาอังกฤษ",
  "ภาษาไทย",
  "สังคมศึกษา",
];

const subjectConfig = {
  "คณิตศาสตร์ 1": { emoji: "📐", gradient: "from-blue-500 to-indigo-600", bg: "bg-blue-50" },
  "คณิตศาสตร์ 2": { emoji: "📊", gradient: "from-indigo-500 to-purple-600", bg: "bg-indigo-50" },
  "ฟิสิกส์": { emoji: "⚛️", gradient: "from-orange-500 to-red-500", bg: "bg-orange-50" },
  "เคมี": { emoji: "🧪", gradient: "from-green-500 to-emerald-600", bg: "bg-green-50" },
  "ชีววิทยา": { emoji: "🧬", gradient: "from-teal-500 to-cyan-600", bg: "bg-teal-50" },
  "ภาษาอังกฤษ": { emoji: "🌍", gradient: "from-violet-500 to-purple-600", bg: "bg-violet-50" },
  "ภาษาไทย": { emoji: "📝", gradient: "from-rose-500 to-pink-600", bg: "bg-rose-50" },
  "สังคมศึกษา": { emoji: "🏛️", gradient: "from-amber-500 to-yellow-600", bg: "bg-amber-50" },
};

export default function SubjectCard({ subject, level, onClick, showLevel = false }) {
  const config = subjectConfig[subject] || { emoji: "📚", gradient: "from-gray-500 to-gray-600", bg: "bg-gray-50" };
  const isALevel = aLevelSubjects.includes(subject);

  return (
    <Card
      onClick={onClick}
      className={`group cursor-pointer overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${isALevel ? "border-2 border-amber-400/60" : "border-0"}`}
    >
      <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
            {config.emoji}
          </div>
          {isALevel ? (
            <Badge className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1">
              <span>A-Level</span>
            </Badge>
          ) : showLevel && level ? (
            <Badge variant="secondary" className="text-xs">
              Lv.{level}
            </Badge>
          ) : null}
        </div>
        <h3 className="font-heading font-semibold mt-3 group-hover:text-primary transition-colors">
          {subject}
        </h3>
      </div>
    </Card>
  );
}