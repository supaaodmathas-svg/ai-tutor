import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

export default function SavedQuizzes() {
  const { user } = useAuth();

  const { data: savedQuizzes = [] } = useQuery({
    queryKey: ["saved-quizzes", user?.id],
    queryFn: () => base44.entities.SavedQuiz.filter({ user_id: user.id }, "-created_date", 5),
    enabled: !!user?.id,
  });

  if (savedQuizzes.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-bold text-muted-foreground mb-3">📂 ข้อสอบล่าสุดที่เคยทำ</p>
      <div className="bg-card rounded-3xl border-2 border-border shadow-sm divide-y divide-border">
        {savedQuizzes.map((sq) => (
          <Link
            key={sq.id}
            to={`/practice?savedQuizId=${sq.id}`}
            className="flex items-center justify-between px-5 py-3 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">{sq.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {sq.questions?.length} ข้อ {sq.grade ? `• ${sq.grade}` : ""} • Lv.{sq.difficulty_level}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap">ทำซ้ำ ฟรี!</span>
          </Link>
        ))}
      </div>
    </div>
  );
}