"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plane, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const strength = password.length > 8 ? (password.match(/(?=.*[A-Z])(?=.*[0-9])/) ? "strong" : "medium") : "weak";
  const strengthColors = { weak: "bg-danger", medium: "bg-urgent", strong: "bg-success" };
  const strengthWidth = { weak: "33%", medium: "66%", strong: "100%" };

  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/verify");
  };

  return (
    <div className="min-h-[calc(100vh-68px-200px)] flex">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-brand-800 flex items-center justify-center"><Plane size={18} className="text-white" /></div>
            <span className="font-sora font-bold text-xl text-ink-800">SkyWing</span>
          </div>
          <h1 className="font-sora font-bold text-h1 text-ink-800 mb-1">Create your account</h1>
          <p className="text-sm text-ink-400 mb-6">Join SkyWing for faster bookings and exclusive deals.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-label text-ink-500 block mb-1">Full Name*</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500" placeholder="S M Moshiur Rahman" />
            </div>
            <div>
              <label className="text-label text-ink-500 block mb-1">Email*</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500" placeholder="moshiur@example.com" />
            </div>
            <div>
              <label className="text-label text-ink-500 block mb-1">Phone*</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2.5 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500" placeholder="+880 1712-345678" />
            </div>
            <div>
              <label className="text-label text-ink-500 block mb-1">Password*</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500 pr-10" placeholder="Min 8 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" aria-label="Toggle password">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="h-1 rounded-full bg-line overflow-hidden">
                    <div className={`h-full rounded-full ${strengthColors[strength]} transition-all`} style={{ width: strengthWidth[strength] }} />
                  </div>
                  <p className="text-xs text-ink-400 mt-1 capitalize">Password strength: {strength}</p>
                </div>
              )}
            </div>
            <label className="flex items-start gap-2 text-sm text-ink-600 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-brand-500" /> I agree to the Terms & Conditions and Privacy Policy
            </label>
            <button type="submit" className="w-full py-2.5 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors">
              Create account
            </button>
          </form>

          <p className="text-center text-sm text-ink-400 mt-6">
            Already have an account? <Link href="/login" className="text-brand-600 hover:text-brand-800 font-medium">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-950 via-brand-900 to-ink-900 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="relative text-center text-white p-8">
          <Plane size={48} className="mx-auto mb-4 opacity-50" />
          <h2 className="font-sora font-bold text-2xl mb-2">Join 100,000+ travellers</h2>
          <p className="text-white/60">Save your preferences, earn rewards, and book faster</p>
        </div>
      </div>
    </div>
  );
}
