export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      game_rounds: {
        Row: {
          created_at: string | null
          customer_order: number
          distributor_cost: number
          distributor_round_cost: number
          distributor_stock: number
          factory_cost: number
          factory_round_cost: number
          factory_stock: number
          game_id: string | null
          id: string
          retailer_cost: number
          retailer_round_cost: number
          retailer_stock: number
          round: number
          wholesaler_cost: number
          wholesaler_round_cost: number
          wholesaler_stock: number
        }
        Insert: {
          created_at?: string | null
          customer_order?: number
          distributor_cost?: number
          distributor_round_cost?: number
          distributor_stock: number
          factory_cost?: number
          factory_round_cost?: number
          factory_stock: number
          game_id?: string | null
          id?: string
          retailer_cost?: number
          retailer_round_cost?: number
          retailer_stock: number
          round: number
          wholesaler_cost?: number
          wholesaler_round_cost?: number
          wholesaler_stock: number
        }
        Update: {
          created_at?: string | null
          customer_order?: number
          distributor_cost?: number
          distributor_round_cost?: number
          distributor_stock?: number
          factory_cost?: number
          factory_round_cost?: number
          factory_stock?: number
          game_id?: string | null
          id?: string
          retailer_cost?: number
          retailer_round_cost?: number
          retailer_stock?: number
          round?: number
          wholesaler_cost?: number
          wholesaler_round_cost?: number
          wholesaler_stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_rounds_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string | null
          current_round: number | null
          game_code: string
          holding_cost: number
          id: string
          shortage_cost: number
          status: string | null
        }
        Insert: {
          created_at?: string | null
          current_round?: number | null
          game_code: string
          holding_cost?: number
          id?: string
          shortage_cost?: number
          status?: string | null
        }
        Update: {
          created_at?: string | null
          current_round?: number | null
          game_code?: string
          holding_cost?: number
          id?: string
          shortage_cost?: number
          status?: string | null
        }
        Relationships: []
      }
      pending_orders: {
        Row: {
          created_at: string | null
          delivery_round: number
          destination: string
          fulfilled: boolean
          game_id: string | null
          id: string
          quantity: number
          round: number
          source: string
          status: string
        }
        Insert: {
          created_at?: string | null
          delivery_round: number
          destination: string
          fulfilled?: boolean
          game_id?: string | null
          id?: string
          quantity: number
          round: number
          source: string
          status?: string
        }
        Update: {
          created_at?: string | null
          delivery_round?: number
          destination?: string
          fulfilled?: boolean
          game_id?: string | null
          id?: string
          quantity?: number
          round?: number
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_orders_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string | null
          game_id: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          role: string
        }
        Update: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
