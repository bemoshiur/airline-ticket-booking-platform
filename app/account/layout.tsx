"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  User, BookOpen, Users, CreditCard, Receipt, HelpCircle, Settings, LogOut,
} from "lucide-react";

const sidebarItems = [
  { href: "/account", icon: User, label: "My Account" },
  { href: "/account/travellers", icon: Users, label: "Travellers" },
  { href: "/account/bookings", icon: BookOpen, label: "My Bookings" },
  { href: "/account/cards", icon: CreditCard, label: "Saved Cards" },
  { href: "/account/payments", icon: Receipt, label: "Payments" },
  { href: "/account/support", icon: HelpCircle, label: "Support Tickets" },
  { href: "/account/settings", icon: Settings, label: "Settings" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8">
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <nav className="sticky top-20 space-y-0.5">
            {sidebarItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-brand-100 text-brand-800 border-l-3 border-brand-500"
                      : "text-ink-500 hover:bg-surface-alt hover:text-ink-700"
                  )}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
            <div className="border-t border-line my-2" />
            <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-ink-500 hover:bg-surface-alt hover:text-ink-700 w-full transition-all">
              <LogOut size={18} />
              Logout
            </button>
          </nav>
        </aside>

        {/* Mobile tabs */}
        <div className="md:hidden w-full overflow-x-auto mb-4">
          <div className="flex gap-1 pb-2">
            {sidebarItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                    active ? "bg-brand-500 text-white" : "bg-surface-alt text-ink-500"
                  )}
                >
                  <item.icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
