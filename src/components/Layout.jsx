import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Home, BookOpen, Trophy, CreditCard, User, LogOut, Menu,
  Swords, FlaskConical, Sun, Moon
} from "lucide-react";

const navItems = [
  { path: "/", label: "หน้าหลัก", icon: Home, emoji: "🏠" },
  { path: "/subjects", label: "เลือกวิชา", icon: BookOpen, emoji: "📚" },
  { path: "/practice", label: "ฝึกทำข้อสอบ", icon: FlaskConical, emoji: "✏️" },
  { path: "/battle", label: "แข่งขัน", icon: Swords, emoji: "⚔️" },
  { path: "/tournament", label: "Tournament", icon: Trophy, emoji: "🏆" },
  { path: "/tokens", label: "เติม Token", icon: CreditCard, emoji: "💎" },
  { path: "/profile", label: "โปรไฟล์", icon: User, emoji: "👤" },
];

function NavLink({ item, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;

  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
        isActive
          ? "bg-primary text-white shadow-md shadow-primary/30"
          : "text-white/55 hover:bg-white/8 hover:text-white"
      }`}
    >
      <span className="text-base">{item.emoji}</span>
      {item.label}
    </Link>
  );
}

function ThemeToggle({ className = "" }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all bg-white/10 hover:bg-white/20 text-white ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {isDark ? "Light" : "Dark"}
    </button>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col bg-[hsl(222,35%,12%)] z-40">
        <div className="px-5 py-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-full text-white font-bold text-base leading-none" style={{background: "linear-gradient(135deg, #4F46E5, #9333EA)", boxShadow: "0 0 18px rgba(139,92,246,0.55)"}}>AI</div>
            <div>
              <h1 className="font-display font-bold text-base text-white leading-none">AI Tutor</h1>
              <p className="text-xs text-white/45 font-body mt-0.5">Highschool Edition</p>
            </div>
          </Link>
        </div>

        {/* Token display */}
        <div className="mx-4 mt-4 mb-2 p-3 rounded-xl bg-white/8 border border-white/10">
          <p className="text-xs text-white/50 font-semibold mb-1">⚡ Token คงเหลือ</p>
          <p className="text-xl font-display font-bold text-white">{user?.tokens ?? 50}</p>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => <NavLink key={item.path} item={item} />)}
        </nav>

        <div className="px-4 py-3 border-t border-white/10 space-y-2">
          <ThemeToggle className="w-full justify-center" />
          <button
            onClick={() => logout("/")}
            className="flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white transition-colors w-full px-3 py-2 rounded-xl hover:bg-white/8"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-[hsl(222,35%,12%)] z-40 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full text-white font-bold text-xs leading-none" style={{background: "linear-gradient(135deg, #4F46E5, #9333EA)", boxShadow: "0 0 12px rgba(139,92,246,0.55)"}}>AI</div>
          <span className="font-display font-bold text-white">AI Tutor</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10">
            <span className="text-sm">⚡</span>
            <span className="text-sm font-bold text-white">{user?.tokens ?? 50}</span>
          </div>
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/10 text-white">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0 bg-[hsl(222,35%,12%)] border-white/10">
              <div className="px-5 py-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg">
                    {user?.full_name?.[0] || "U"}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">{user?.full_name || "ผู้ใช้"}</p>
                    <p className="text-xs text-white/50">{user?.email}</p>
                  </div>
                </div>
              </div>
              <nav className="p-3 space-y-0.5">
                {navItems.map((item) => (
                  <NavLink key={item.path} item={item} onClick={() => setOpen(false)} />
                ))}
              </nav>
              <div className="px-4 py-4 border-t border-white/10 space-y-2">
                <ThemeToggle className="w-full justify-center" />
                <button
                  onClick={() => logout("/")}
                  className="flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  ออกจากระบบ
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-60 pt-14 lg:pt-0 min-h-screen bg-background">
        <div className="p-5 md:p-8 max-w-3xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}