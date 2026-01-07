"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, LogOut, Loader2 } from "lucide-react";

export function Navbar() {
  const { user, profile, loading, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300">
              <FileSpreadsheet className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              Ledger<span className="text-emerald-400">Leap</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            {loading ? (
              <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
            ) : user ? (
              <>
                {/* Credits Badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-sm text-emerald-400 font-medium">
                    {profile?.credits_balance ?? 0} credits
                  </span>
                </div>

                <Button
                  asChild
                  variant="ghost"
                  className="text-slate-300 hover:text-white hover:bg-white/5"
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut()}
                  className="text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-slate-300 hover:text-white hover:bg-white/5"
                >
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
                >
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
