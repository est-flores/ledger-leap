import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { UploadZone } from "@/components/upload-zone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  FileSpreadsheet,
  Download,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { Metadata } from "next";
import type { Profile, Conversion } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your conversions and credits",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch user profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const profile = profileData as Profile | null;

  // Fetch conversions
  const { data: conversionsData } = await supabase
    .from("conversions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  const conversions = (conversionsData as Conversion[] | null) ?? [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">
            Manage your conversions and track your credits
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Credits */}
          <div className="lg:col-span-1 space-y-6">
            {/* Credits Card */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-400" />
                  Your Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-emerald-400">
                    {profile?.credits_balance ?? 0}
                  </span>
                  <span className="text-slate-400">credits remaining</span>
                </div>
                {profile?.credits_balance === 0 && (
                  <p className="text-sm text-amber-400 mt-2">
                    Contact support to top up your credits
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Upload Zone */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                New Conversion
              </h2>
              <UploadZone />
            </div>
          </div>

          {/* Right Column - Conversion History */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">
                  Conversion History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conversions && conversions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700/50 hover:bg-transparent">
                          <TableHead className="text-slate-400">File</TableHead>
                          <TableHead className="text-slate-400">Status</TableHead>
                          <TableHead className="text-slate-400">Date</TableHead>
                          <TableHead className="text-slate-400 text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conversions.map((conversion) => (
                          <TableRow
                            key={conversion.id}
                            className="border-slate-700/50"
                          >
                            <TableCell className="font-medium text-white">
                              <div className="flex items-center gap-2">
                                <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                                <span className="truncate max-w-[200px]">
                                  {conversion.file_name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(conversion.status)}
                            </TableCell>
                            <TableCell className="text-slate-400">
                              {formatDate(conversion.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              {conversion.status === "completed" &&
                                conversion.result_path && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </Button>
                                )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileSpreadsheet className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      No conversions yet
                    </h3>
                    <p className="text-slate-400">
                      Upload a bank statement to get started
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
