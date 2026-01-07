// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// @deno-types="npm:@types/node"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import ExcelJS from "https://esm.sh/exceljs@4.4.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Transaction {
  date: string | null;
  description: string | null;
  withdrawal: number | null;
  deposit: number | null;
  balance: number | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client with user's JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

    // Client with user's auth for RLS
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Admin client for credit operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) {
      throw new Error("Invalid authentication");
    }

    // Parse request body
    const { conversionId, filePath } = await req.json();

    if (!conversionId || !filePath) {
      throw new Error("Missing conversionId or filePath");
    }

    // Step 1: Check and decrement credit atomically
    const { data: hasCredit, error: creditError } = await supabaseAdmin.rpc(
      "decrement_credit",
      { target_user_id: user.id }
    );

    if (creditError) {
      throw new Error(`Credit check failed: ${creditError.message}`);
    }

    if (!hasCredit) {
      // Update conversion status to failed
      await supabaseAdmin
        .from("conversions")
        .update({ status: "failed" })
        .eq("id", conversionId);

      throw new Error("Insufficient credits");
    }

    // Step 2: Download file from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("raw-files")
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Step 3: Convert file to base64 for OpenAI
    const arrayBuffer = await fileData.arrayBuffer();
    const base64File = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    // Determine media type
    const isPdf = filePath.toLowerCase().endsWith(".pdf");
    const mediaType = isPdf ? "application/pdf" : "image/jpeg";

    // Step 4: Send to OpenAI GPT-4o Vision
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a financial document parser. Extract all transactions from the bank statement.
Return ONLY a valid JSON array with objects containing:
{ "date": "YYYY-MM-DD or original format", "description": "transaction description", "withdrawal": number or null, "deposit": number or null, "balance": number or null }
Use null for empty/missing values. Do not include markdown, code blocks, or any explanation. Return only the raw JSON array.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all transactions from this bank statement. Return only the JSON array.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mediaType};base64,${base64File}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 4096,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    // Parse the JSON response
    let transactions: Transaction[];
    try {
      // Clean up potential markdown formatting
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      transactions = JSON.parse(cleanContent.trim());
    } catch {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("Failed to parse transaction data from AI response");
    }

    // Step 5: Generate Excel file
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Transactions");

    // Add header row with styling
    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Description", key: "description", width: 40 },
      { header: "Withdrawal", key: "withdrawal", width: 15 },
      { header: "Deposit", key: "deposit", width: 15 },
      { header: "Balance", key: "balance", width: 15 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF10B981" }, // Emerald color
    };
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Add data rows
    transactions.forEach((transaction) => {
      worksheet.addRow({
        date: transaction.date || "",
        description: transaction.description || "",
        withdrawal: transaction.withdrawal,
        deposit: transaction.deposit,
        balance: transaction.balance,
      });
    });

    // Format number columns
    ["C", "D", "E"].forEach((col) => {
      worksheet.getColumn(col).numFmt = "$#,##0.00";
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Step 6: Upload result to storage
    const resultFileName = `${user.id}/${conversionId}.xlsx`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("results")
      .upload(resultFileName, buffer, {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload result: ${uploadError.message}`);
    }

    // Step 7: Update conversion status
    const { error: updateError } = await supabaseAdmin
      .from("conversions")
      .update({
        status: "completed",
        result_path: resultFileName,
      })
      .eq("id", conversionId);

    if (updateError) {
      throw new Error(`Failed to update conversion: ${updateError.message}`);
    }

    // Step 8: Generate signed download URL
    const { data: signedUrlData, error: signedUrlError } =
      await supabaseAdmin.storage
        .from("results")
        .createSignedUrl(resultFileName, 3600); // 1 hour expiry

    if (signedUrlError) {
      throw new Error(`Failed to create download URL: ${signedUrlError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        resultUrl: signedUrlData.signedUrl,
        transactionCount: transactions.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing statement:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
