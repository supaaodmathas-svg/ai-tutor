import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Home, BookOpen, Trophy, CreditCard, User, LogOut, Menu,
  Zap, GraduationCap, Swords, FlaskConical
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
      className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
        isActive
          ? "bg-primary text-white shadow-md"
          : "text-foreground/70 hover:bg-purple-50 hover:text-foreground"
      }`}
    >
      <span className="text-base">{item.emoji}</span>
      {item.label}
    </Link>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col bg-white border-r-2 border-border z-40 shadow-sm">
        <div className="px-5 py-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-3xl">🌈</span>
            <div>
              <h1 className="font-display font-bold text-lg text-primary leading-none">AI Tutor</h1>
              <p className="text-xs text-muted-foreground font-body">เรียนรู้สนุก ๆ</p>
            </div>
          </Link>
        </div>

        {/* Token display */}
        <div className="mx-4 mb-4 p-3 rounded-2xl bg-secondary border border-border">
          <p className="text-xs text-muted-foreground font-semibold mb-1">⚡ Token คงเหลือ</p>
          <p className="text-2xl font-display font-bold text-primary">{user?.tokens ?? 50}</p>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => <NavLink key={item.path} item={item} />)}
        </nav>

        <div className="px-4 py-4 border-t border-border">
          <button
            onClick={() => logout("/")}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-red-400 transition-colors w-full px-3 py-2 rounded-2xl hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-white border-b-2 border-border z-40 flex items-center justify-between px-4 shadow-sm">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🌈</span>
          <span className="font-display font-bold text-primary">AI Tutor</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border">
            <span className="text-sm">⚡</span>
            <span className="text-sm font-bold text-primary">{user?.tokens ?? 50}</span>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-secondary">
                <Menu className="w-5 h-5 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0 bg-white">
              <div className="px-5 py-5 border-b-2 border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-lg">
                    {user?.full_name?.[0] || "U"}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{user?.full_name || "ผู้ใช้"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
              </div>
              <nav className="p-3 space-y-1">
                {navItems.map((item) => (
                  <NavLink key={item.path} item={item} onClick={() => setOpen(false)} />
                ))}
              </nav>
              <div className="px-4 py-4 border-t border-border">
                <button
                  onClick={() => logout("/")}
                  className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-red-400 transition-colors"
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
      <main className="lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        <div className="p-5 md:p-8 max-w-3xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}