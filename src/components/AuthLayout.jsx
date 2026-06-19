import React from "react";
import { Link } from "react-router-dom";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div
              className="px-5 py-2.5 rounded-full text-white font-bold text-lg leading-none"
              style={{
                background: "linear-gradient(135deg, #4F46E5, #9333EA)",
                boxShadow: "0 0 20px rgba(139,92,246,0.55)",
              }}
            >
              AI
            </div>
            <span className="font-display font-bold text-2xl text-foreground">AI Tutor</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>}
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
  );
}