import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { UploadZone } from "@/components/upload-zone";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Zap,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" />
          </div>

          <div className="relative container mx-auto px-4 pt-20 pb-32">
            <div className="text-center max-w-4xl mx-auto mb-12">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
                <Zap className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium">
                  Powered by GPT-4o Vision
                </span>
              </div>

              {/* Heading */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                <span className="text-white">Convert Bank Statements to</span>
                <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Excel in Seconds
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
                Upload your PDF bank statement and get a perfectly formatted
                Excel spreadsheet. No manual data entry. No errors.
                Just instant results.
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/25 text-lg px-8"
                >
                  <Link href="/sign-up">
                    Get 3 Free Credits
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 text-lg px-8"
                >
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
            </div>

            {/* Upload Zone */}
            <div className="max-w-2xl mx-auto">
              <UploadZone />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-slate-900/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Why Choose LedgerLeap?
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                We use cutting-edge AI to extract data with unmatched accuracy
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <article className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300 group">
                <div className="p-3 rounded-xl bg-emerald-500/10 w-fit mb-6 group-hover:bg-emerald-500/20 transition-colors">
                  <Zap className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Lightning Fast
                </h3>
                <p className="text-slate-400">
                  Upload your statement and get results in under 30 seconds.
                  No waiting, no delays.
                </p>
              </article>

              {/* Feature 2 */}
              <article className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300 group">
                <div className="p-3 rounded-xl bg-emerald-500/10 w-fit mb-6 group-hover:bg-emerald-500/20 transition-colors">
                  <Shield className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Secure & Private
                </h3>
                <p className="text-slate-400">
                  Your files are encrypted and automatically deleted after 24
                  hours. Your data stays yours.
                </p>
              </article>

              {/* Feature 3 */}
              <article className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300 group">
                <div className="p-3 rounded-xl bg-emerald-500/10 w-fit mb-6 group-hover:bg-emerald-500/20 transition-colors">
                  <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Clean Formatting
                </h3>
                <p className="text-slate-400">
                  Get properly structured data with dates, descriptions,
                  amounts, and balances all in the right columns.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                How It Works
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Three simple steps to convert your bank statements
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-emerald-400">1</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Upload Your File
                </h3>
                <p className="text-slate-400">
                  Drag and drop your PDF bank statement or image
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-emerald-400">2</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  AI Processing
                </h3>
                <p className="text-slate-400">
                  Our AI extracts every transaction with precision
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-emerald-400">3</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Download Excel
                </h3>
                <p className="text-slate-400">
                  Get your formatted spreadsheet instantly
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
              Sign up now and get 3 free credits to try LedgerLeap
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/25 text-lg px-8"
            >
              <Link href="/sign-up">
                Start Converting Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
