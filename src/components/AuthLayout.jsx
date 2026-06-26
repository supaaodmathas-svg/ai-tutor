import React from "react";
import { Link } from "react-router-dom";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left decorative panel — hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #3730a3 0%, #4F46E5 40%, #7c3aed 100%)" }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #6ee7b7, transparent)" }} />

        {/* Big dino logo */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-72 h-72 rounded-full overflow-hidden bg-white shadow-2xl mb-2">
            <img
              src="https://media.base44.com/images/public/6a301ff5fe467608523f8e74/3b86a8beb_ChatGPT_Image_Jun_26_2026_06_33_05_PM.png"
              alt="DINOTutor Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-4xl font-display font-black text-white tracking-tight mb-3">
            DINO<span className="text-yellow-300">Tutor</span>
          </h1>
          <p className="text-indigo-200 text-lg font-medium max-w-xs leading-relaxed">
            แพลตฟอร์มเรียนรู้อัจฉริยะ<br />ด้วย AI สำหรับมัธยมศึกษา
          </p>

          {/* Feature badges */}
          <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
            {[
              { icon: "🧠", text: "AI สร้างข้อสอบตรงระดับคุณ" },
              { icon: "⚔️", text: "แข่งขันกับเพื่อนแบบ Real-time" },
              { icon: "📊", text: "วิเคราะห์จุดอ่อนด้วย Learning Twin" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl px-4 py-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-white text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white shadow-lg mb-1">
              <img
                src="https://media.base44.com/images/public/6a301ff5fe467608523f8e74/3b86a8beb_ChatGPT_Image_Jun_26_2026_06_33_05_PM.png"
                alt="DINOTutor Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-display font-black text-2xl text-foreground">
              DINO<span className="text-primary">Tutor</span>
            </span>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-foreground">{title}</h2>
            {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
          </div>

          {/* Card */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
            {children}
          </div>

          {footer && (
            <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
          )}
        </div>
      </div>
    </div>
  );
}