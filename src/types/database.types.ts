export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          credits_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          credits_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          credits_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversions: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          status: "pending" | "completed" | "failed";
          result_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          status?: "pending" | "completed" | "failed";
          result_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          status?: "pending" | "completed" | "failed";
          result_path?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      add_credits: {
        Args: {
          target_user_id: string;
          amount: number;
        };
        Returns: undefined;
      };
      decrement_credit: {
        Args: {
          target_user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Conversion = Database["public"]["Tables"]["conversions"]["Row"];
