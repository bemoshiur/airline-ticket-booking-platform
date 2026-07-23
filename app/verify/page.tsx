"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plane } from "lucide-react";

export default function VerifyPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(timer - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (idx: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[idx] = value.slice(-1);
    setOtp(newOtp);
    if (value && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d{1,6}$/.test(paste)) {
      const newOtp = [...otp];
      paste.split("").forEach((char, i) => { if (i < 6) newOtp[i] = char; });
      setOtp(newOtp);
      const nextIdx = Math.min(paste.length, 5);
      inputsRef.current[nextIdx]?.focus();
    }
  };

  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/");
  };

  return (
    <div className="min-h-[calc(100vh-68px-200px)] flex">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-brand-800 flex items-center justify-center"><Plane size={18} className="text-white" /></div>
            <span className="font-sora font-bold text-xl text-ink-800">SkyWing</span>
          </div>
          <h1 className="font-sora font-bold text-h1 text-ink-800 mb-1">Verify your email</h1>
          <p className="text-sm text-ink-400 mb-6">Enter the 6-digit code sent to moshiur@example.com</p>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputsRef.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-12 text-center text-lg font-semibold border border-line rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              ))}
            </div>

            <button type="submit" className="w-full py-2.5 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors mb-4" disabled={otp.some((d) => !d)}>
              Verify
            </button>

            <p className="text-sm text-ink-400">
              {timer > 0 ? (
                <>Resend code in <span className="text-ink-700 font-medium">{timer}s</span></>
              ) : (
                <button type="button" onClick={() => setTimer(60)} className="text-brand-600 hover:text-brand-800 font-medium">Resend code</button>
              )}
            </p>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-950 via-brand-900 to-ink-900 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="relative text-center text-white p-8">
          <Plane size={48} className="mx-auto mb-4 opacity-50" />
          <h2 className="font-sora font-bold text-2xl mb-2">Secure verification</h2>
          <p className="text-white/60">We take your security seriously</p>
        </div>
      </div>
    </div>
  );
}
