import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Home, BookOpen, Trophy, CreditCard, User, LogOut, Menu,
  Swords, FlaskConical, Sun, Moon, Brain, FileText, Building2, Gamepad2, Lock, LayoutDashboard } from
"lucide-react";

const studentItems = [
{ path: "/", label: "หน้าหลัก", icon: Home },
{ path: "/subjects", label: "วัดระดับวิชา", icon: BookOpen },
{ path: "/practice", label: "ฝึกทำข้อสอบ", icon: FlaskConical },
{ path: "/learning-twin", label: "AI Learning Twin", icon: Brain },
{ path: "/exam-generator", label: "Exam Generator", icon: FileText },
{ path: "/ai-colab", label: "AI Colab", icon: Building2 },
{ path: "/classroom", label: "ห้องเรียนสด", icon: Gamepad2 },
{ path: "/battle", label: "Quiz Battle", icon: Swords },
{ path: "/tournament", label: "Tournament", icon: Trophy },
{ path: "/tokens", label: "เติม Token", icon: CreditCard },
{ path: "/profile", label: "โปรไฟล์", icon: User }];

const teacherItems = [
{ path: "/teacher-dashboard", label: "Teacher Dashboard", icon: LayoutDashboard },
{ path: "/profile", label: "โปรไฟล์", icon: User }];


function NavLink({ item, onClick, disabled }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;

  if (disabled) {
    return (
      <div
        title="เฉพาะบัญชีครู"
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold opacity-40 cursor-not-allowed text-white/55">
        <item.icon className="w-4 h-4 shrink-0" />
        {item.label}
        <Lock className="w-3.5 h-3.5 ml-auto" />
      </div>
    );
  }

  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
      isActive ?
      "bg-primary text-white shadow-md shadow-primary/30" :
      "text-white/55 hover:bg-white/8 hover:text-white"}`
      }>
      
      <item.icon className="w-4 h-4 shrink-0" />
      {item.label}
    </Link>);

}

function ThemeToggle({ className = "" }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all bg-white/10 hover:bg-white/20 text-white ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
      
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {isDark ? "Light" : "Dark"}
    </button>);

}

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const isTeacher = user?.user_type === "teacher";
  // ครู: เห็นเฉพาะเมนูครู | นักเรียน: เห็นเมนูนักเรียน + ปุ่ม Teacher Dashboard ล็อกไว้
  const navItems = isTeacher
    ? teacherItems
    : [...studentItems, { path: "/teacher-dashboard", label: "Teacher Dashboard", icon: LayoutDashboard, teacherOnly: true }];

  return (
    <div className="min-h-screen bg-background">

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col bg-[hsl(222,35%,12%)] z-40">
        <div className="px-5 py-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <img src="https://media.base44.com/images/public/6a301ff5fe467608523f8e74/3b86a8beb_ChatGPT_Image_Jun_26_2026_06_33_05_PM.png" alt="Dino Tutor" className="w-12 h-12 rounded-full object-cover" />
            <div>
              <h1 className="font-display font-bold text-base text-white leading-none">Dino Tutor</h1>
              <p className="text-xs text-white/45 font-body mt-0.5">เรียนเร็วกว่าใคร</p>
            </div>
          </Link>
        </div>

        {/* Token display */}
        <div className="mx-4 mt-4 mb-2 p-3 rounded-xl bg-white/8 border border-white/10">
          <p className="text-xs text-white/50 font-semibold mb-1">⚡ Token คงเหลือ</p>
          <p className="text-xl font-display font-bold text-white">{user?.tokens ?? 50}</p>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} disabled={item.teacherOnly && !isTeacher} />
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-white/10 space-y-2">
          <ThemeToggle className="w-full justify-center" />
          <button
            onClick={() => logout("/")}
            className="flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white transition-colors w-full px-3 py-2 rounded-xl hover:bg-white/8">
            
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-[hsl(222,35%,12%)] z-40 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="https://media.base44.com/images/public/6a301ff5fe467608523f8e74/3b86a8beb_ChatGPT_Image_Jun_26_2026_06_33_05_PM.png" alt="Dino Tutor" className="w-8 h-8 rounded-full object-cover" />
          <span className="font-display font-bold text-white">Dino Tutor</span>
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
                {navItems.map((item) =>
                <NavLink
                  key={item.path}
                  item={item}
                  onClick={() => setOpen(false)}
                  disabled={item.teacherOnly && !isTeacher} />
                )}
              </nav>
              <div className="px-4 py-4 border-t border-white/10 space-y-2">
                <ThemeToggle className="w-full justify-center" />
                <button
                  onClick={() => logout("/")}
                  className="flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white transition-colors">
                  
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
    </div>);

}