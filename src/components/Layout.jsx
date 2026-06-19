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
  { path: "/", label: "หน้าหลัก", icon: Home },
  { path: "/subjects", label: "เลือกวิชา", icon: BookOpen },
  { path: "/practice", label: "ฝึกทำข้อสอบ", icon: FlaskConical },
  { path: "/battle", label: "แข่งขัน", icon: Swords },
  { path: "/tournament", label: "Tournament", icon: Trophy },
  { path: "/tokens", label: "เติม Token", icon: CreditCard },
  { path: "/profile", label: "โปรไฟล์", icon: User },
];

function NavLink({ item, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-secondary text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
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
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-56 flex-col bg-card border-r border-border z-40">
        <div className="px-5 py-6">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-base">Iknow</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => <NavLink key={item.path} item={item} />)}
        </nav>

        <div className="px-5 py-4 border-t border-border">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{user?.tokens ?? 50} Tokens</span>
          </div>
          <button
            onClick={() => logout("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-card border-b border-border z-40 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <span className="font-display font-bold">Iknow</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-medium">{user?.tokens ?? 50}</span>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0">
              <div className="px-5 py-5 border-b border-border">
                <p className="font-medium text-sm">{user?.full_name || "ผู้ใช้"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <nav className="p-3 space-y-0.5">
                {navItems.map((item) => (
                  <NavLink key={item.path} item={item} onClick={() => setOpen(false)} />
                ))}
              </nav>
              <div className="px-5 py-4 border-t border-border">
                <button
                  onClick={() => logout("/")}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
      <main className="lg:ml-56 pt-14 lg:pt-0 min-h-screen">
        <div className="p-5 md:p-8 max-w-3xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}