import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { School, RefreshCw, BookOpen, CalendarDays, Clock, DoorOpen } from "lucide-react";
import { TEACHING_DAYS, TEACHING_PERIODS, SUBJECT_SCHEDULE, TEACHING_ROOMS } from "@/lib/teachingSchedule";

export default function SchoolDashboard({ user, onResetSubject, onResetType }) {
  const subject = user?.teaching_subject;
  const schedule = SUBJECT_SCHEDULE[subject] || [];

  // รวมรายชื่อห้องที่สอน (ไม่ซ้ำ)
  const teachingRooms = TEACHING_ROOMS.filter((room) =>
    schedule.some((s) => s.room === room)
  );

  // ตารางเวลา matrix [period][day] = room
  const cellOf = (day, period) =>
    schedule.find((s) => s.day === day && s.period === period);

  const periodTime = (periodLabel) =>
    TEACHING_PERIODS.find((p) => p.period === periodLabel)?.time || "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <School className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Teacher Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              ครู {user?.full_name || user?.email} · สถาบันศึกษา
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary text-primary">
            <BookOpen className="w-3 h-3 mr-1" /> {subject}
          </Badge>
          <Button variant="ghost" size="sm" onClick={onResetSubject} title="เปลี่ยนวิชาที่สอน">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* สรุป */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4 border-0 shadow">
          <div className="flex items-center gap-2 text-primary mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-xs text-muted-foreground">วิชาที่สอน</span>
          </div>
          <p className="text-lg font-display font-bold">{subject}</p>
        </Card>
        <Card className="p-4 border-0 shadow">
          <div className="flex items-center gap-2 text-accent mb-1">
            <DoorOpen className="w-4 h-4" />
            <span className="text-xs text-muted-foreground">จำนวนห้องที่สอน</span>
          </div>
          <p className="text-lg font-display font-bold">{teachingRooms.length} ห้อง</p>
        </Card>
        <Card className="p-4 border-0 shadow">
          <div className="flex items-center gap-2 text-primary mb-1">
            <CalendarDays className="w-4 h-4" />
            <span className="text-xs text-muted-foreground">คาบสอน/สัปดาห์</span>
          </div>
          <p className="text-lg font-display font-bold">{schedule.length} คาบ</p>
        </Card>
      </div>

      {/* รายชื่อห้องที่สอน */}
      <Card className="p-5 border-0 shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <DoorOpen className="w-4 h-4" />
          <h2 className="font-display font-semibold">ห้องที่คุณสอน ({teachingRooms.length})</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {teachingRooms.map((room) => {
            const count = schedule.filter((s) => s.room === room).length;
            return (
              <Badge key={room} variant="secondary" className="text-sm py-1.5 px-3">
                {room} · {count} คาบ
              </Badge>
            );
          })}
        </div>
      </Card>

      {/* ตารางคาบสอนสัปดาห์ */}
      <Card className="p-5 border-0 shadow-lg space-y-3 overflow-x-auto">
        <div className="flex items-center gap-2 text-primary">
          <CalendarDays className="w-4 h-4" />
          <h2 className="font-display font-semibold">ตารางคาบสอนสัปดาห์</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          ตารางสมมุติสำหรับ {subject} — จันทร์ถึงศุกร์, ห้อง 1-5
        </p>
        <table className="w-full text-sm border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="text-left text-xs text-muted-foreground font-semibold p-2 sticky left-0 bg-card">คาบ / เวลา</th>
              {TEACHING_DAYS.map((day) => (
                <th key={day} className="text-center text-xs text-muted-foreground font-semibold p-2 min-w-[110px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TEACHING_PERIODS.map(({ period, time }) => (
              <tr key={period}>
                <td className="p-2 text-xs font-semibold text-muted-foreground sticky left-0 bg-card">
                  <div>{period}</div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                    <Clock className="w-3 h-3" /> {time}
                  </div>
                </td>
                {TEACHING_DAYS.map((day) => {
                  const cell = cellOf(day, period);
                  return (
                    <td key={day} className="p-1">
                      {cell ? (
                        <div className="rounded-lg bg-primary/10 border border-primary/30 px-2 py-2 text-center">
                          <p className="text-xs font-bold text-primary">{cell.room}</p>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-muted/40 px-2 py-2 text-center text-muted-foreground/40 text-xs">—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Button variant="ghost" size="sm" onClick={onResetType} className="text-muted-foreground">
        <RefreshCw className="w-4 h-4 mr-2" /> เปลี่ยนประเภทสถาบัน
      </Button>
    </div>
  );
}