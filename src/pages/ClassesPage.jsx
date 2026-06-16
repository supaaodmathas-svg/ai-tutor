import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Clock, Loader2, CheckCircle, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const gradeOptions = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];

export default function ClassesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: () => base44.entities.Class.list("-created_date", 20),
  });

  const handleJoin = async (cls) => {
    const alreadyJoined = cls.students?.some(s => s.user_id === user?.id);
    if (alreadyJoined) {
      toast({ title: "คุณอยู่ในคลาสนี้แล้ว" });
      return;
    }
    if ((cls.students?.length || 0) >= cls.max_students) {
      toast({ title: "คลาสเต็มแล้ว", variant: "destructive" });
      return;
    }
    const updatedStudents = [...(cls.students || []), {
      user_id: user.id,
      user_name: user.full_name || user.email,
      joined_date: new Date().toISOString(),
    }];
    await base44.entities.Class.update(cls.id, { students: updatedStudents });
    queryClient.invalidateQueries({ queryKey: ["classes"] });
    toast({ title: "✅ เข้าร่วมคลาสสำเร็จ!" });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">คลาสเรียน</h1>
            <p className="text-sm text-muted-foreground">เข้าเรียนคลาสสดตามตาราง</p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : classes.length === 0 ? (
        <Card className="p-12 border-0 shadow-sm text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">ยังไม่มีคลาสตอนนี้</p>
          <p className="text-xs text-muted-foreground mt-1">กรุณารอผู้ดูแลระบบสร้างคลาสเรียน</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map(cls => {
            const joined = cls.students?.some(s => s.user_id === user?.id);
            const isFull = (cls.students?.length || 0) >= cls.max_students;
            return (
              <Card key={cls.id} className="p-5 border-0 shadow-md hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-heading font-semibold">{cls.title}</h3>
                    <p className="text-xs text-muted-foreground">{cls.subject} • {cls.grade_level}</p>
                  </div>
                  <Badge variant={cls.status === "เปิดรับ" ? "default" : cls.status === "เต็ม" ? "destructive" : "secondary"}>
                    {cls.status}
                  </Badge>
                </div>
                {cls.description && (
                  <p className="text-sm text-muted-foreground mb-3">{cls.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  {cls.schedule && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {cls.schedule}</span>
                  )}
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {cls.students?.length || 0}/{cls.max_students}</span>
                </div>
                <Button
                  onClick={() => handleJoin(cls)}
                  disabled={cls.status !== "เปิดรับ" || isFull || joined}
                  className="w-full"
                  variant={joined ? "outline" : "default"}
                >
                  {joined ? <><CheckCircle className="w-4 h-4 mr-2" /> เข้าร่วมแล้ว</> : isFull ? "เต็ม" : "เข้าร่วมคลาส"}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}