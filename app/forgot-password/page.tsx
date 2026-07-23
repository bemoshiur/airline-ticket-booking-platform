"use client";

import { useState } from "react";
import Link from "next/link";
import { Plane, ArrowLeft, Check } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-[calc(100vh-68px-200px)] flex">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/login" className="flex items-center gap-1 text-sm text-ink-400 hover:text-ink-700 mb-8">
            <ArrowLeft size={14} /> Back to login
          </Link>
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-brand-800 flex items-center justify-center"><Plane size={18} className="text-white" /></div>
            <span className="font-sora font-bold text-xl text-ink-800">SkyWing</span>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
                <Check size={24} className="text-success" />
              </div>
              <h1 className="font-sora font-bold text-h1 text-ink-800 mb-1">Check your email</h1>
              <p className="text-sm text-ink-400 mb-6">We sent a password reset link to <strong className="text-ink-700">{email}</strong></p>
              <p className="text-xs text-ink-400">Didn&apos;t receive it? <button onClick={() => setSent(false)} className="text-brand-600 hover:text-brand-800 font-medium">Resend</button></p>
            </div>
          ) : (
            <>
              <h1 className="font-sora font-bold text-h1 text-ink-800 mb-1">Forgot password?</h1>
              <p className="text-sm text-ink-400 mb-6">No worries. Enter your email and we&apos;ll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-label text-ink-500 block mb-1">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500" placeholder="moshiur@example.com" required />
                </div>
                <button type="submit" className="w-full py-2.5 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors">
                  Send reset link
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-950 via-brand-900 to-ink-900 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="relative text-center text-white p-8">
          <Plane size={48} className="mx-auto mb-4 opacity-50" />
          <h2 className="font-sora font-bold text-2xl mb-2">Don&apos;t worry</h2>
          <p className="text-white/60">We&apos;ll help you get back in</p>
        </div>
      </div>
    </div>
  );
}
