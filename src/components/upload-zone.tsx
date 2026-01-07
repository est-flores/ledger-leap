"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  LogIn,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  trackFileDropped,
  trackConversionStart,
  trackConversionComplete,
  trackConversionError,
  trackInsufficientCreditsError,
  trackContactSupportClick,
} from "@/lib/analytics";

interface UploadZoneProps {
  onUploadComplete?: (resultUrl: string) => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const supabase = createClient();

  // Track insufficient credits when user has 0 credits
  useEffect(() => {
    if (user && profile && profile.credits_balance <= 0) {
      trackInsufficientCreditsError(profile.credits_balance);
    }
  }, [user, profile]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      const startTime = Date.now();

      // Determine file type for analytics
      const fileType: "pdf" | "img" = file.type === "application/pdf" ? "pdf" : "img";
      const fileSizeMb = parseFloat((file.size / (1024 * 1024)).toFixed(2));

      // Track file dropped event
      trackFileDropped(fileType, fileSizeMb);

      setUploadedFile(file);
      setUploading(true);

      try {
        // Upload file to Supabase Storage
        const fileName = `${user!.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("raw-files")
          .upload(fileName, file);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        setUploading(false);
        setProcessing(true);

        // Track conversion start
        trackConversionStart(file.name);

        // Create conversion record
        const { data: conversion, error: conversionError } = await supabase
          .from("conversions")
          .insert({
            user_id: user!.id,
            file_name: file.name,
            status: "pending",
          } as never)
          .select()
          .single();

        if (conversionError) {
          throw new Error(conversionError.message);
        }

        const conversionData = conversion as { id: string } | null;

        // Call the Edge Function to process the file
        const { data, error: functionError } = await supabase.functions.invoke(
          "process-statement",
          {
            body: {
              conversionId: conversionData?.id,
              filePath: fileName,
            },
          }
        );

        if (functionError) {
          // Track conversion error
          trackConversionError("FUNCTION_ERROR", functionError.message);
          throw new Error(functionError.message);
        }

        // Track conversion complete
        const processingTimeMs = Date.now() - startTime;
        trackConversionComplete(
          processingTimeMs,
          data?.transactionCount,
          data?.pagesCount
        );

        // Refresh profile to update credit balance
        await refreshProfile();

        toast.success("File processed successfully!");
        if (onUploadComplete && data?.resultUrl) {
          onUploadComplete(data.resultUrl);
        }
      } catch (error) {
        console.error("Upload error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to process file";

        // Track conversion error
        trackConversionError("UPLOAD_ERROR", errorMessage);

        toast.error(errorMessage);
      } finally {
        setUploading(false);
        setProcessing(false);
        setUploadedFile(null);
      }
    },
    [user, supabase, refreshProfile, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: !user || !profile || profile.credits_balance <= 0 || uploading || processing,
  });

  // Not logged in state
  if (!user) {
    return (
      <Card className="p-8 border-2 border-dashed border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 rounded-full bg-slate-700/50">
            <LogIn className="h-8 w-8 text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Sign Up to Get Started
            </h3>
            <p className="text-slate-400 mb-4">
              Create an account and get <strong className="text-emerald-400">3 free credits</strong> to convert your bank statements
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                <Link href="/sign-up">Sign Up Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // No credits state
  if (profile && profile.credits_balance <= 0) {
    return (
      <Card className="p-8 border-2 border-dashed border-amber-500/30 bg-amber-500/5 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 rounded-full bg-amber-500/20">
            <CreditCard className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No Credits Remaining
            </h3>
            <p className="text-slate-400 mb-4">
              You&apos;ve used all your credits. Contact support to top up your account.
            </p>
            <Button
              variant="outline"
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
              onClick={() => trackContactSupportClick("no_credits_upload_zone")}
            >
              Contact Support
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      {...getRootProps()}
      className={`p-8 border-2 border-dashed transition-all duration-300 cursor-pointer ${
        isDragActive
          ? "border-emerald-500 bg-emerald-500/10"
          : "border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/70"
      } backdrop-blur-sm`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        {processing ? (
          <>
            <div className="p-4 rounded-full bg-emerald-500/20 animate-pulse">
              <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Processing with AI...
              </h3>
              <p className="text-slate-400">
                Extracting transactions from your statement
              </p>
            </div>
          </>
        ) : uploading ? (
          <>
            <div className="p-4 rounded-full bg-blue-500/20">
              <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Uploading...
              </h3>
              <p className="text-slate-400">{uploadedFile?.name}</p>
            </div>
          </>
        ) : isDragActive ? (
          <>
            <div className="p-4 rounded-full bg-emerald-500/20">
              <Upload className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Drop your file here
              </h3>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 rounded-full bg-slate-700/50">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Drop your bank statement here
              </h3>
              <p className="text-slate-400 mb-2">
                or click to browse files
              </p>
              <p className="text-sm text-slate-500">
                Supports PDF and images (PNG, JPG) up to 10MB
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">
                {profile?.credits_balance} credits available
              </span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
