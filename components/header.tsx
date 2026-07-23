"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Plane,
  Bell,
  ChevronDown,
  User,
  LogOut,
  BookOpen,
  CreditCard,
  Users,
  Ticket,
  Settings,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-[68px] bg-surface border-b border-line transition-shadow",
        scrolled && "shadow-sm"
      )}
    >
      <div className="max-w-[1360px] mx-auto h-full px-4 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-brand-800 font-sora font-bold text-xl no-underline">
          <div className="w-9 h-9 rounded-lg bg-brand-800 flex items-center justify-center">
            <Plane size={18} className="text-white" />
          </div>
          SkyWing
        </Link>

        {/* Nav - desktop */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/flights"
            className="px-4 py-2 rounded-md text-sm font-medium text-brand-800 bg-brand-100"
          >
            Flights
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Currency */}
          <button className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-ink-500 hover:bg-surface-alt transition-colors focus-ring">
            <span className="tabular-nums">৳</span> BDT
            <ChevronDown size={14} />
          </button>

          {/* Language */}
          <button className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-ink-500 hover:bg-surface-alt transition-colors focus-ring">
            EN <span className="text-ink-300">|</span> বাং
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-md text-ink-500 hover:bg-surface-alt transition-colors focus-ring" aria-label="Notifications">
            <Bell size={20} />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
              3
            </span>
          </button>

          {/* Avatar */}
          <div className="relative">
            <button
              onClick={() => setAvatarOpen(!avatarOpen)}
              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-surface-alt transition-colors focus-ring"
              aria-label="Account menu"
            >
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-semibold text-sm">
                SM
              </div>
              <ChevronDown size={14} className="text-ink-400 hidden sm:block" />
            </button>

            {avatarOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setAvatarOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-56 bg-surface border border-line rounded-lg shadow-e3 z-20 py-1 animate-slide-down">
                  <div className="px-4 py-2 border-b border-line">
                    <p className="text-sm font-medium text-ink-700">S M Moshiur</p>
                    <p className="text-xs text-ink-400">moshiur@example.com</p>
                  </div>
                  <Link href="/account" className="flex items-center gap-3 px-4 py-2 text-sm text-ink-700 hover:bg-surface-alt transition-colors" onClick={() => setAvatarOpen(false)}>
                    <User size={16} className="text-ink-400" /> My Profile
                  </Link>
                  <Link href="/account/bookings" className="flex items-center gap-3 px-4 py-2 text-sm text-ink-700 hover:bg-surface-alt transition-colors" onClick={() => setAvatarOpen(false)}>
                    <BookOpen size={16} className="text-ink-400" /> My Bookings
                  </Link>
                  <Link href="/account/travellers" className="flex items-center gap-3 px-4 py-2 text-sm text-ink-700 hover:bg-surface-alt transition-colors" onClick={() => setAvatarOpen(false)}>
                    <Users size={16} className="text-ink-400" /> Saved Travellers
                  </Link>
                  <Link href="/account/cards" className="flex items-center gap-3 px-4 py-2 text-sm text-ink-700 hover:bg-surface-alt transition-colors" onClick={() => setAvatarOpen(false)}>
                    <CreditCard size={16} className="text-ink-400" /> Saved Cards
                  </Link>
                  <Link href="/account/support" className="flex items-center gap-3 px-4 py-2 text-sm text-ink-700 hover:bg-surface-alt transition-colors" onClick={() => setAvatarOpen(false)}>
                    <HelpCircle size={16} className="text-ink-400" /> Support Tickets
                  </Link>
                  <Link href="/account/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-ink-700 hover:bg-surface-alt transition-colors" onClick={() => setAvatarOpen(false)}>
                    <Settings size={16} className="text-ink-400" /> Change Password
                  </Link>
                  <div className="border-t border-line my-1" />
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-ink-700 hover:bg-surface-alt transition-colors" onClick={() => setAvatarOpen(false)}>
                    <LogOut size={16} className="text-ink-400" /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-md text-ink-500 hover:bg-surface-alt transition-colors focus-ring"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface border-b border-line px-4 py-3 space-y-2 animate-slide-down">
          <Link href="/flights" className="block px-3 py-2 rounded-md text-sm font-medium text-brand-800 bg-brand-100" onClick={() => setMobileMenuOpen(false)}>
            Flights
          </Link>
        </div>
      )}
    </header>
  );
}
