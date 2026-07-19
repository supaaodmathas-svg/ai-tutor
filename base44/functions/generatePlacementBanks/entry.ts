import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SUBJECTS = [
  "คณิตศาสตร์ 1", "คณิตศาสตร์ 2", "ฟิสิกส์", "เคมี",
  "ชีววิทยา", "ภาษาอังกฤษ", "ภาษาไทย", "สังคมศึกษา"
];

const BANKS_PER_SUBJECT = 5;

const AI_TUTOR_RULES = `คุณคือ "AI Tutor" ผู้ช่วยด้านการศึกษาที่เชี่ยวชาญตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐานของประเทศไทย (สพฐ.)
หน้าที่หลักคือการสร้างข้อสอบและอธิบายเนื้อหาโดยอ้างอิงข้อมูลจากหลักสูตรแกนกลางเท่านั้น ความถูกต้องสำคัญกว่าความรวดเร็ว
ลำดับความสำคัญ: 1. หลักสูตรแกนกลาง สพฐ. (มาตรฐาน/ตัวชี้วัด/ผลการเรียนรู้) 2. เอกสารที่ผ่านการตรวจสอบ
กฎสร้างข้อสอบ: ตรงระดับชั้น/รายวิชา/บทเรียน/ตัวชี้วัด มีคำตอบถูกเพียงข้อเดียว ไม่กำกวม อธิบายเหตุผลได้ ห้ามสร้างจากข้อมูลนอกหลักสูตร
การป้องกัน Hallucination: ห้ามสร้างขึ้นเองเด็ดขาดสำหรับ สูตรคำนวณ นิยาม ข้อเท็จจริงวิทยาศาสตร์ ประวัติศาสตร์ คำศัพท์ ตัวชี้วัด ผลการเรียนรู้
หากไม่พบข้อมูลที่ตรวจสอบได้ ให้ตอบ "ไม่พบข้อมูลที่สามารถยืนยันได้จากฐานข้อมูลหลักสูตรการศึกษาขั้นพื้นฐาน" และห้ามคาดเดา
ก่อนส่งผลลัพธ์ตรวจสอบ: อ้างอิงหลักสูตรแกนกลาง คำตอบและเฉลยถูกต้อง ระดับความยากตรงตามกำหนด ไม่มี Hallucination
Confidence Score ต่ำกว่า 90% ห้ามส่งผลลัพธ์ ให้สร้างใหม่
---`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const subjectsToGenerate = body.subjects || SUBJECTS;
    const results = [];

    for (const subject of subjectsToGenerate) {
      // Check existing banks
      const existing = await base44.asServiceRole.entities.PlacementTestBank.filter({ subject });
      const existingIndices = existing.map(b => b.bank_index);

      for (let bankIdx = 1; bankIdx <= BANKS_PER_SUBJECT; bankIdx++) {
        if (existingIndices.includes(bankIdx)) {
          results.push({ subject, bank_index: bankIdx, status: 'skipped' });
          continue;
        }

        const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
          model: 'gemini_3_flash',
          prompt: `${AI_TUTOR_RULES}
สร้างข้อสอบวัดระดับวิชา ${subject} สำหรับนักเรียนมัธยมศึกษา จำนวน 10 ข้อ (ชุดที่ ${bankIdx})
ข้อสอบต้องครอบคลุมหลายระดับความยาก (level 1-5) โดย:
- level 1-2: ง่าย (พื้นฐาน)
- level 3: ปานกลาง
- level 4-5: ยาก (ประยุกต์)

กฎ:
- แต่ละข้อมี choices 4 ตัวเลือกเสมอ
- correct_answer คือ index 0, 1, 2 หรือ 3
- เนื้อหาภาษาไทย ตรงหลักสูตรมัธยม
- ชุดที่ ${bankIdx} ต้องแตกต่างจากชุดอื่น ใช้โจทย์/ตัวเลข/สถานการณ์ที่ต่างกัน
- explanation: อธิบายเหตุผลและวิธีคิด`,
          response_json_schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    level: { type: "number" },
                    question: { type: "string" },
                    choices: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } },
                    correct_answer: { type: "number" },
                    explanation: { type: "string" }
                  }
                }
              }
            }
          }
        });

        const questions = (res.questions || []).slice(0, 10);

        await base44.asServiceRole.entities.PlacementTestBank.create({
          subject,
          bank_index: bankIdx,
          questions
        });

        results.push({ subject, bank_index: bankIdx, status: 'created', count: questions.length });
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});