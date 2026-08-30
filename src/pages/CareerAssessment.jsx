import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Compass } from "lucide-react";
import CareerQuestionnaire from "@/components/career/CareerQuestionnaire";
import CareerAnalysisResult from "@/components/career/CareerAnalysisResult";
import { useToast } from "@/components/ui/use-toast";

export default function CareerAssessment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const { data: assessment, isLoading } = useQuery({
    queryKey: ["career-assessment", user?.id],
    queryFn: () => base44.entities.CareerAssessment.filter({ user_id: user.id, completed: true }, "-created_date", 1),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (assessment && assessment.length > 0) {
      setResult(assessment[0].analysis);
    }
  }, [assessment]);

  const handleSubmit = async (form) => {
    setAnalyzing(true);
    try {
      // Step 1: Gemini + web search for latest labor market trends
      const marketRes = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        add_context_from_internet: true,
        prompt: `ค้นข้อมูลตลาดแรงงานล่าสุดในประเทศไทย ปี 2026 สำหรับสายการเรียนและอาชีพที่เกี่ยวข้องกับ:
- สายที่สนใจ: ${form.preferred_paths.join(", ")}
- ความฝัน/อาชีพที่อยากเป็น: ${form.dream_career}
- ถนัด: ${form.strengths.join(", ")}

สรุปให้กระชับว่า: แนวโน้มความต้องการในตลาดแรงงานปัจจุบัน, อาชีพที่กำลังเติบโต/มีความต้องการสูง, โอกาสเติบโตในอนาคต 5-10 ปี, และเงินเดือนเฉลี่ยของสายนี้`,
      });

      // Step 2: Claude deep analysis with student profile + market research
      const analysis = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `คุณเป็นที่ปรึกษาอาชีพและการศึกษาผู้เชี่ยวชาญในไทย จงวิเคราะห์นักเรียนคนนี้และแนะนำสายการเรียน คณะ สาขาที่เหมาะสมที่สุด

ข้อมูลนักเรียน:
- สายการเรียนที่สนใจ: ${form.preferred_paths.join(", ")}
- ความฝัน/อาชีพที่อยากเป็น: ${form.dream_career || "ไม่ระบุ"}
- สิ่งที่ถนัด: ${form.strengths.join(", ")}
- ความสามารถพิเศษ/งานอดิเรก: ${form.special_abilities || "ไม่ระบุ"}
- คนรอบตัวมักขอให้ช่วย: ${form.help_others_with.join(", ")}
- วิชาที่ชอบ: ${form.favorite_subjects || "ไม่ระบุ"}
- บรรยากาศการทำงานที่ชอบ: ${form.work_style}

ข้อมูลตลาดแรงงานล่าสุด (จากการค้นเว็บ):
${typeof marketRes === "string" ? marketRes : JSON.stringify(marketRes)}

จงวิเคราะห์และแนะนำ:
1. สายการเรียน (สายศึกษา/แผนการเรียน) ที่เหมาะกับนักเรียนที่สุด พร้อมเหตุผล
2. คณะและสาขาที่เหมาะสม (3 ทางเลือก) พร้อมคะแนนความเข้ากัน (match_score 0-100) และเหตุผล
3. แนวโน้มตลาดแรงงานล่าสุดของสาย/คณะนี้
4. โอกาสเติบโตในอนาคต
5. วิชาที่ควรเน้นตั้งแต่ตอนนี้ (ระดับมัธยม)
6. สิ่งที่นักเรียนจะเจอ/เรียนในอนาคต (ทั้งในมหาวิทยาลัยและการทำงาน)
7. สรุปสั้นๆ 1 ย่อหน้า

เขียนเป็นภาษาไทย ใช้น้ำเสียงเป็นกันเองและให้กำลังใจ สำหรับนักเรียนระดับ ม.1-6`,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_path: { type: "string" },
            path_reason: { type: "string" },
            recommended_faculties: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  faculty: { type: "string" },
                  branch: { type: "string" },
                  reason: { type: "string" },
                  match_score: { type: "number" },
                },
              },
            },
            labor_market_trend: { type: "string" },
            growth_opportunity: { type: "string" },
            focus_subjects: { type: "array", items: { type: "string" } },
            future_expectations: { type: "string" },
            summary: { type: "string" },
          },
        },
      });

      // Save
      await base44.entities.CareerAssessment.create({
        user_id: user.id,
        ...form,
        market_research: typeof marketRes === "string" ? marketRes : JSON.stringify(marketRes),
        analysis,
        completed: true,
      });

      setResult(analysis);
      queryClient.invalidateQueries({ queryKey: ["career-assessment"] });
      queryClient.invalidateQueries({ queryKey: ["has-career-assessment"] });
      toast({ title: "วิเคราะห์เสร็จแล้ว!", description: "ดูผลการวิเคราะห์สายการเรียนของคุณได้เลย" });
    } catch (err) {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message || "ลองใหม่อีกครั้ง", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRetake = async () => {
    if (assessment?.[0]?.id) {
      await base44.entities.CareerAssessment.delete(assessment[0].id);
    }
    setResult(null);
    queryClient.invalidateQueries({ queryKey: ["career-assessment"] });
    queryClient.invalidateQueries({ queryKey: ["has-career-assessment"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Compass className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">วิเคราะห์สายการเรียน & อาชีพอนาคต</h1>
          <p className="text-sm text-muted-foreground">AI วิเคราะห์แนวทางการเรียนและคณะที่เหมาะกับคุณ พร้อมข้อมูลตลาดแรงงานล่าสุด</p>
        </div>
      </div>

      {result ? (
        <CareerAnalysisResult analysis={result} onRetake={handleRetake} />
      ) : (
        <CareerQuestionnaire onSubmit={handleSubmit} analyzing={analyzing} />
      )}
    </div>
  );
}