import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Compass, GraduationCap, TrendingUp, Rocket, BookOpen, Telescope,
  Sparkles, RotateCcw, Target, Award, BarChart3
} from "lucide-react";
import { motion } from "framer-motion";

export default function CareerAnalysisResult({ analysis, onRetake }) {
  if (!analysis) return null;
  const a = analysis;

  return (
    <div className="space-y-5">
      {/* Summary hero */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}>
          <div className="absolute top-4 right-5">
            <Sparkles className="w-8 h-8 text-white/40" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Compass className="w-5 h-5 text-white" />
            <p className="text-white/80 text-sm font-semibold">สรุปผลการวิเคราะห์</p>
          </div>
          <p className="text-white font-display font-medium leading-relaxed text-lg">{a.summary}</p>
        </div>
      </motion.div>

      {/* Recommended path */}
      <Card className="p-5 border-0 shadow space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <Target className="w-5 h-5" />
          <h3 className="font-display font-bold text-lg">สายการเรียนที่แนะนำ</h3>
        </div>
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <p className="font-display font-bold text-xl text-primary">{a.recommended_path}</p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{a.path_reason}</p>
        </div>
      </Card>

      {/* Recommended faculties */}
      {a.recommended_faculties?.length > 0 && (
        <Card className="p-5 border-0 shadow space-y-3">
          <div className="flex items-center gap-2 text-accent">
            <GraduationCap className="w-5 h-5" />
            <h3 className="font-display font-bold text-lg">คณะ & สาขาที่เหมาะกับคุณ</h3>
          </div>
          <div className="space-y-3">
            {a.recommended_faculties.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-4 rounded-xl bg-muted/40 border border-border"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-display font-bold">{f.faculty}</p>
                    <p className="text-sm text-primary font-semibold">{f.branch}</p>
                  </div>
                  {typeof f.match_score === "number" && (
                    <Badge className="bg-accent text-accent-foreground shrink-0">
                      <Award className="w-3 h-3 mr-1" /> {f.match_score}%
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.reason}</p>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Labor market + growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 border-0 shadow space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <BarChart3 className="w-5 h-5" />
            <h3 className="font-display font-bold">ตลาดแรงงานล่าสุด</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{a.labor_market_trend}</p>
        </Card>
        <Card className="p-5 border-0 shadow space-y-2">
          <div className="flex items-center gap-2 text-accent">
            <Rocket className="w-5 h-5" />
            <h3 className="font-display font-bold">โอกาสเติบโต</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{a.growth_opportunity}</p>
        </Card>
      </div>

      {/* Focus subjects */}
      {a.focus_subjects?.length > 0 && (
        <Card className="p-5 border-0 shadow space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-display font-bold text-lg">วิชาที่ควรเน้นตั้งแต่นี้</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {a.focus_subjects.map((s, i) => (
              <Badge key={i} variant="secondary" className="text-sm py-1.5 px-3">{s}</Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Future expectations */}
      <Card className="p-5 border-0 shadow space-y-2">
        <div className="flex items-center gap-2 text-accent">
          <Telescope className="w-5 h-5" />
          <h3 className="font-display font-bold text-lg">สิ่งที่คุณจะเจอในการเรียนอนาคต</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{a.future_expectations}</p>
      </Card>

      {/* Retake */}
      <div className="pt-2">
        <Button variant="outline" onClick={onRetake} className="w-full">
          <RotateCcw className="w-4 h-4 mr-2" /> ทำแบบประเมินใหม่
        </Button>
      </div>
    </div>
  );
}