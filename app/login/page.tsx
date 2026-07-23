"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plane, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/");
  };

  return (
    <div className="min-h-[calc(100vh-68px-200px)] flex">
      {/* Form side */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-brand-800 flex items-center justify-center">
              <Plane size={18} className="text-white" />
            </div>
            <span className="font-sora font-bold text-xl text-ink-800">SkyWing</span>
          </div>

          <h1 className="font-sora font-bold text-h1 text-ink-800 mb-1">Welcome back</h1>
          <p className="text-sm text-ink-400 mb-6">Sign in to manage your bookings and saved travellers.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-label text-ink-500 block mb-1">Email or Phone</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="moshiur@example.com"
                className="w-full px-3 py-2.5 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-label text-ink-500 block mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500 pr-10"
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" aria-label="Toggle password">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-brand-500" /> Remember me
              </label>
              <Link href="/forgot-password" className="text-brand-600 hover:text-brand-800">Forgot password?</Link>
            </div>
            <button type="submit" className="w-full py-2.5 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors">
              Sign in
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-line" /></div>
            <div className="relative flex justify-center"><span className="bg-surface px-3 text-xs text-ink-400">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="px-4 py-2.5 rounded-lg border border-line text-sm text-ink-500 hover:bg-surface-alt transition-colors cursor-not-allowed opacity-60">
              Google
            </button>
            <button className="px-4 py-2.5 rounded-lg border border-line text-sm text-ink-500 hover:bg-surface-alt transition-colors cursor-not-allowed opacity-60">
              Facebook
            </button>
          </div>

          <p className="text-center text-sm text-ink-400 mt-6">
            Don&apos;t have an account? <Link href="/register" className="text-brand-600 hover:text-brand-800 font-medium">Register</Link>
          </p>
        </div>
      </div>

      {/* Image side */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-950 via-brand-900 to-ink-900 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="relative text-center text-white p-8">
          <Plane size={48} className="mx-auto mb-4 opacity-50" />
          <h2 className="font-sora font-bold text-2xl mb-2">Book flights with confidence</h2>
          <p className="text-white/60">Access your bookings, manage travellers, and get support 24/7</p>
        </div>
      </div>
    </div>
  );
}
