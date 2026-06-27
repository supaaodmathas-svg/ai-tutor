import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const DAY_REWARDS = [5, 5, 5, 10, 10, 10, 10, 15, 15, 20];

const dayEmojis = ["🌱", "⭐", "✨", "🌟", "💫", "🎯", "🎪", "🏅", "🥈", "🏆"];

function getTokensForDay(day) {
  return DAY_REWARDS[Math.min(day - 1, 9)];
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export default function DailyLoginReward({ onClose }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loginRecord, setLoginRecord] = useState(null);
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [probonusEarned, setProbonusEarned] = useState(0);

  useEffect(() => {
    loadRecord();
  }, []);

  const loadRecord = async () => {
    setLoading(true);
    const records = await base44.entities.DailyLogin.filter({ user_id: user.id });
    const rec = records[0] || null;
    setLoginRecord(rec);
    if (rec && rec.last_login_date === getTodayDate()) {
      setClaimed(true);
    }
    setLoading(false);
  };

  const todayStr = getTodayDate();
  const currentStreak = loginRecord?.streak || 0;
  const displayDay = claimed ? currentStreak : currentStreak + 1;
  const todayTokens = getTokensForDay(displayDay);

  const claim = async () => {
    if (claiming || claimed) return;
    setClaiming(true);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];

    const isConsecutive = loginRecord?.last_login_date === yStr;
    const newStreak = loginRecord ? (isConsecutive ? (loginRecord.streak % 10) + 1 : 1) : 1;
    const tokensToAdd = getTokensForDay(newStreak);

    if (loginRecord) {
      await base44.entities.DailyLogin.update(loginRecord.id, {
        streak: newStreak,
        last_login_date: todayStr,
        total_days: (loginRecord.total_days || 0) + 1,
        tokens_earned_today: tokensToAdd,
      });
    } else {
      await base44.entities.DailyLogin.create({
        user_id: user.id,
        streak: 1,
        last_login_date: todayStr,
        total_days: 1,
        tokens_earned_today: tokensToAdd,
      });
    }

    // AI Pro daily 100 token bonus (วันที่ 2+ จนครบ 30 วัน)
    let proBonus = 0;
    const freshUser = await base44.auth.me();
    if (freshUser?.is_premium && freshUser?.premium_start_date) {
      const startDate = new Date(freshUser.premium_start_date);
      const daysPassed = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
      const premiumExpired = daysPassed >= 30;
      const alreadyGotToday = freshUser.premium_last_daily_date === todayStr;

      if (premiumExpired) {
        // หมดอายุ ถอด premium
        await base44.auth.updateMe({ is_premium: false });
      } else if (!alreadyGotToday) {
        proBonus = 100;
        await base44.auth.updateMe({
          tokens: (freshUser.tokens ?? 0) + tokensToAdd + proBonus,
          premium_last_daily_date: todayStr,
        });
      } else {
        await base44.auth.updateMe({ tokens: (freshUser.tokens ?? 0) + tokensToAdd });
      }
    } else {
      const currentTokens = freshUser?.tokens ?? user?.tokens ?? 0;
      await base44.auth.updateMe({ tokens: currentTokens + tokensToAdd });
    }

    queryClient.invalidateQueries();
    setClaimed(true);
    setClaiming(false);
    setProbonusEarned(proBonus);
    setTimeout(() => { window.location.reload(); }, 800);
  };

  if (loading) return null;

  const streakForDisplay = claimed ? currentStreak : currentStreak;
  const activeDay = claimed ? currentStreak : currentStreak + 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border-4 border-purple-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-400 to-pink-400 p-5 text-white text-center">
            <p className="text-3xl mb-1">🎁</p>
            <h2 className="text-xl font-display font-bold">รับ Token รายวัน!</h2>
            <p className="text-sm opacity-90">เข้าสู่ระบบทุกวัน รับ Token เพิ่มขึ้นเรื่อยๆ</p>
          </div>

          {/* Road Map */}
          <div className="p-5">
            <p className="text-xs font-bold text-muted-foreground mb-3 text-center">🛣️ Road ความต่อเนื่อง</p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Array.from({ length: 10 }, (_, i) => {
                const day = i + 1;
                const tokens = getTokensForDay(day);
                const isPast = day < activeDay;
                const isToday = day === activeDay;
                const isFuture = day > activeDay;

                return (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`relative flex flex-col items-center p-2 rounded-2xl border-2 transition-all ${
                      isToday
                        ? "border-purple-400 bg-purple-50 shadow-md scale-105"
                        : isPast
                        ? "border-green-300 bg-green-50"
                        : "border-gray-200 bg-gray-50 opacity-60"
                    }`}
                  >
                    {isPast && (
                      <span className="absolute -top-1.5 -right-1.5 text-xs bg-green-400 text-white rounded-full w-4 h-4 flex items-center justify-center">✓</span>
                    )}
                    {isToday && (
                      <span className="absolute -top-1.5 -right-1.5 text-xs bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center">!</span>
                    )}
                    <span className="text-lg">{dayEmojis[i]}</span>
                    <span className={`text-xs font-bold ${isToday ? "text-purple-600" : isPast ? "text-green-600" : "text-gray-400"}`}>
                      วัน {day}
                    </span>
                    <span className={`text-xs font-bold ${isToday ? "text-purple-700" : isPast ? "text-green-700" : "text-gray-400"}`}>
                      +{tokens}⚡
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Today's reward highlight */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-3 text-center mb-4">
              {claimed ? (
                <>
                  <p className="text-sm font-bold text-green-600">✅ รับ Token วันนี้แล้ว!</p>
                  {probonusEarned > 0 && (
                    <p className="text-xs font-bold text-amber-600 mt-1">👑 +{probonusEarned} Token โบนัส AI Pro!</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">กลับมาพรุ่งนี้เพื่อรับ Token อีกครั้ง</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">วันนี้ (วันที่ {activeDay})</p>
                  <p className="text-2xl font-display font-bold text-primary">+{todayTokens} ⚡ Token</p>
                </>
              )}
            </div>

            {/* Claim / Close */}
            {!claimed ? (
              <button
                onClick={claim}
                disabled={claiming}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold text-base shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              >
                {claiming ? "กำลังรับ..." : `🎁 รับ ${todayTokens} Token เลย!`}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-all"
              >
                ปิด
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}