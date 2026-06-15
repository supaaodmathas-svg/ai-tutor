import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export default function QuizQuestion({ question, index, total, selectedAnswer, onAnswer, showResult = false }) {
  const levelColors = {
    1: "bg-green-100 text-green-700",
    2: "bg-blue-100 text-blue-700",
    3: "bg-yellow-100 text-yellow-700",
    4: "bg-orange-100 text-orange-700",
    5: "bg-red-100 text-red-700",
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={index}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6 md:p-8 border-0 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">
                ข้อ {index + 1} / {total}
              </span>
              <Badge className={levelColors[question.level] || "bg-muted"}>
                Level {question.level}
              </Badge>
            </div>
            <div className="h-2 flex-1 max-w-32 ml-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                style={{ width: `${((index + 1) / total) * 100}%` }}
              />
            </div>
          </div>

          <h3 className="text-lg md:text-xl font-heading font-semibold mb-6 leading-relaxed">
            {question.question}
          </h3>

          <div className="space-y-3">
            {question.choices?.map((choice, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = showResult && i === question.correct_answer;
              const isWrong = showResult && isSelected && i !== question.correct_answer;

              return (
                <button
                  key={i}
                  onClick={() => !showResult && onAnswer(i)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    isCorrect
                      ? "border-green-500 bg-green-50 text-green-800"
                      : isWrong
                      ? "border-red-500 bg-red-50 text-red-800"
                      : isSelected
                      ? "border-primary bg-primary/5 text-foreground shadow-md"
                      : "border-border hover:border-primary/50 hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        isCorrect
                          ? "bg-green-500 text-white"
                          : isWrong
                          ? "bg-red-500 text-white"
                          : isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span className="pt-1 text-sm md:text-base">{choice}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {showResult && question.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200"
            >
              <p className="text-sm font-medium text-blue-800 mb-1">💡 คำอธิบาย</p>
              <p className="text-sm text-blue-700">{question.explanation}</p>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}