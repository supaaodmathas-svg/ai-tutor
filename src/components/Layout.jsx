import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home, BookOpen, Trophy, CreditCard, User, LogOut, Menu, X,
  Zap, Crown, GraduationCap, Swords, FlaskConical } from
"lucide-react";

const navItems = [
{ path: "/", label: "หน้าหลัก", icon: Home },
{ path: "/subjects", label: "เลือกวิชา", icon: BookOpen },
{ path: "/practice", label: "ฝึกทำข้อสอบ", icon: FlaskConical },
{ path: "/battle", label: "แข่งขัน", icon: Swords },
{ path: "/tournament", label: "Tournament", icon: Trophy },
{ path: "/tokens", label: "เติม Token", icon: CreditCard },
{ path: "/profile", label: "โปรไฟล์", icon: User }];


function NavLink({ item, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive ?
      "bg-primary text-primary-foreground shadow-lg shadow-primary/25" :
      "text-muted-foreground hover:bg-secondary hover:text-foreground"}`
      }>
      
      <Icon className="w-5 h-5" />
      {item.label}
    </Link>);

}

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-card border-r border-border z-40">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold">AI Tutor</h1>
              <p className="text-xs text-muted-foreground">เรียนรู้อัจฉริยะ</p>
            </div>
          </Link>
        </div>

        <div className="p-4 mx-4 mt-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Token คงเหลือ</span>
            {user?.is_premium &&
            <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] px-2">
                <Crown className="w-3 h-3 mr-1" /> PRO
              </Badge>
            }
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold font-display">{user?.tokens ?? 50}</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) =>
          <NavLink key={item.path} item={item} />
          )}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={() => logout("/")}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-all">
            
            <LogOut className="w-5 h-5" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-16 bg-card/80 backdrop-blur-xl border-b border-border z-40 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold">Iknow</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">{user?.tokens ?? 50}</span>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                    {user?.full_name?.[0] || "U"}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{user?.full_name || "ผู้ใช้"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
              </div>
              <nav className="p-4 space-y-1">
                {navItems.map((item) =>
                <NavLink key={item.path} item={item} onClick={() => setOpen(false)} />
                )}
              </nav>
              <div className="p-4 border-t border-border">
                <button
                  onClick={() => logout("/")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-all">
                  
                  <LogOut className="w-5 h-5" />
                  ออกจากระบบ
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>);

}