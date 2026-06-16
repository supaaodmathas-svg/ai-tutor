import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, X } from "lucide-react";

export default function LevelUpOverlay({ subject, newLevel, tokensEarned, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-card rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl border-2 border-amber-300 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
            <div className="absolute top-4 right-4">
              <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-display font-black text-amber-600 mb-1">เลเวลอัป!</h2>
            <p className="text-sm text-muted-foreground mb-4">วิชา {subject}</p>

            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 mb-3">
              <span className="text-3xl font-display font-black text-amber-600">Lv.{newLevel}</span>
            </div>

            {tokensEarned > 0 && (
              <div className="flex items-center justify-center gap-2 text-lg font-bold text-primary">
                <Zap className="w-5 h-5" />
                <span>+{tokensEarned} Tokens</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-4">ปิดอัตโนมัติใน 3 วินาที</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}