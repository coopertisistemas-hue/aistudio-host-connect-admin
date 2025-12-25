export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      amenities: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          guest_email: string
          guest_name: string
          guest_phone: string | null
          id: string
          notes: string | null
          property_id: string
          room_type_id: string
          status: string
          total_amount: number
          total_guests: number
          updated_at: string
          services_json: string[] | null
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          guest_email: string
          guest_name: string
          guest_phone?: string | null
          id?: string
          notes?: string | null
          property_id: string
          room_type_id: string
          status?: string
          total_amount: number
          total_guests?: number
          updated_at?: string
          services_json?: string[] | null
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          guest_email?: string
          guest_name?: string
          guest_phone?: string | null
          id?: string
          notes?: string | null
          property_id?: string
          room_type_id?: string
          status?: string
          total_amount?: number
          total_guests?: number
          updated_at?: string
          services_json?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_photos: {
        Row: {
          created_at: string | null
          display_order: number | null
          entity_id: string
          id: string
          is_primary: boolean | null
          photo_url: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          entity_id: string
          id?: string
          is_primary?: boolean | null
          photo_url: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          entity_id?: string
          id?: string
          is_primary?: boolean | null
          photo_url?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string
          expense_date: string
          id: string
          property_id: string
          updated_at: string
          payment_status: string
          paid_date: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description: string
          expense_date: string
          id?: string
          property_id: string
          updated_at?: string
          payment_status?: string
          paid_date?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          property_id?: string
          updated_at?: string
          payment_status?: string
          paid_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          display_order: number | null
          id: string
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          display_order?: number
          id?: string
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          display_order?: number
          id?: string
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      features: {
        Row: {
          created_at: string
          description: string
          display_order: number | null
          icon: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          icon?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          icon?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      how_it_works_steps: {
        Row: {
          created_at: string
          description: string
          icon: string | null
          id: string
          step_number: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          step_number: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          step_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_visible: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_visible?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_visible?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          booking_id: string
          created_at: string
          due_date: string | null
          id: string
          issue_date: string | null
          paid_amount: number | null
          payment_intent_id: string | null
          payment_method: string | null
          property_id: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          issue_date?: string | null
          paid_amount?: number | null
          payment_intent_id?: string | null
          payment_method?: string | null
          property_id: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          issue_date?: string | null
          paid_amount?: number | null
          payment_intent_id?: string | null
          payment_method?: string | null
          property_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          commission: number
          created_at: string
          description: string | null
          display_order: number | null
          features: Json | null
          id: string
          is_popular: boolean | null
          name: string
          period: string
          price: number
          updated_at: string
        }
        Insert: {
          commission: number
          created_at?: string
          description?: string | null
          display_order?: number
          features?: Json | null
          id?: string
          is_popular?: boolean
          name: string
          period: string
          price: number
          updated_at?: string
        }
        Update: {
          commission?: number
          created_at?: string
          description?: string | null
          display_order?: number
          features?: Json | null
          id?: string
          is_popular?: boolean
          name?: string
          period?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          base_price_override: number | null
          created_at: string
          end_date: string
          id: string
          max_stay: number | null
          min_stay: number | null
          price_modifier: number | null
          promotion_name: string | null
          property_id: string
          room_type_id: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          base_price_override?: number | null
          created_at?: string
          end_date: string
          id?: string
          max_stay?: number | null
          min_stay?: number | null
          price_modifier?: number | null
          promotion_name?: string | null
          property_id: string
          room_type_id?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          base_price_override?: number | null
          created_at?: string
          end_date?: string
          id?: string
          max_stay?: number | null
          min_stay?: number | null
          price_modifier?: number | null
          promotion_name?: string | null
          property_id?: string
          room_type_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_rules_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          plan: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          plan?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          plan?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          city: string
          country: string
          created_at: string
          description: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          postal_code: string | null
          state: string
          status: string
          total_rooms: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          city: string
          country?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          postal_code?: string | null
          state: string
          status?: string
          total_rooms?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          country?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          postal_code?: string | null
          state?: string
          status?: string
          total_rooms?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          id: string
          property_id: string
          room_number: string
          room_type_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          room_number: string
          room_type_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          room_number?: string
          room_type_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      room_types: {
        Row: {
          amenities_json: string[] | null
          base_price: number
          capacity: number
          created_at: string
          description: string | null
          id: string
          name: string
          property_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amenities_json?: string[] | null
          base_price: number
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
          property_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amenities_json?: string[] | null
          base_price?: number
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          property_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_types_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_per_day: boolean
          is_per_person: boolean
          name: string
          price: number
          property_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_per_day?: boolean
          is_per_person?: boolean
          name: string
          price: number
          property_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_per_day?: boolean
          is_per_person?: boolean
          name?: string
          price?: number
          property_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    hostconnect_staff: {
      Row: {
        created_at: string | null
        role: string | null
        user_id: string
      }
      Insert: {
        created_at?: string | null
        role?: string | null
        user_id: string
      }
      Update: {
        created_at?: string | null
        role?: string | null
        user_id?: string
      }
      Relationships: [
        {
          foreignKeyName: "hostconnect_staff_user_id_fkey"
          columns: ["user_id"]
          isOneToOne: true
          referencedRelation: "users"
          referencedColumns: ["id"]
        }
      ]
    }
    tickets: {
      Row: {
        category: string | null
        created_at: string | null
        description: string
        id: string
        severity: string
        status: string
        title: string
        updated_at: string | null
        user_id: string
      }
      Insert: {
        category?: string | null
        created_at?: string | null
        description: string
        id?: string
        severity?: string
        status?: string
        title: string
        updated_at?: string | null
        user_id?: string
      }
      Update: {
        category?: string | null
        created_at?: string | null
        description?: string
        id?: string
        severity?: string
        status?: string
        title?: string
        updated_at?: string | null
        user_id?: string
      }
      Relationships: [
        {
          foreignKeyName: "tickets_user_id_fkey"
          columns: ["user_id"]
          isOneToOne: false
          referencedRelation: "users"
          referencedColumns: ["id"]
        }
      ]
    }
    ticket_comments: {
      Row: {
        content: string
        created_at: string | null
        id: string
        is_staff_reply: boolean | null
        ticket_id: string
        user_id: string
      }
      Insert: {
        content: string
        created_at?: string | null
        id?: string
        is_staff_reply?: boolean | null
        ticket_id: string
        user_id?: string
      }
      Update: {
        content?: string
        created_at?: string | null
        id?: string
        is_staff_reply?: boolean | null
        ticket_id?: string
        user_id?: string
      }
      Relationships: [
        {
          foreignKeyName: "ticket_comments_ticket_id_fkey"
          columns: ["ticket_id"]
          isOneToOne: false
          referencedRelation: "tickets"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "ticket_comments_user_id_fkey"
          columns: ["user_id"]
          isOneToOne: false
          referencedRelation: "users"
          referencedColumns: ["id"]
        }
      ]
    }
    ideas: {
      Row: {
        created_at: string | null
        description: string
        id: string
        status: string
        title: string
        updated_at: string | null
        user_id: string
        votes: number | null
      }
      Insert: {
        created_at?: string | null
        description: string
        id?: string
        status?: string
        title: string
        updated_at?: string | null
        user_id?: string
        votes?: number | null
      }
      Update: {
        created_at?: string | null
        description?: string
        id?: string
        status?: string
        title?: string
        updated_at?: string | null
        user_id?: string
        votes?: number | null
      }
      Relationships: [
        {
          foreignKeyName: "ideas_user_id_fkey"
          columns: ["user_id"]
          isOneToOne: false
          referencedRelation: "users"
          referencedColumns: ["id"]
        }
      ]
    }
    idea_comments: {
      Row: {
        content: string
        created_at: string | null
        id: string
        idea_id: string
        is_staff_reply: boolean | null
        user_id: string
      }
      Insert: {
        content: string
        created_at?: string | null
        id?: string
        idea_id: string
        is_staff_reply?: boolean | null
        user_id?: string
      }
      Update: {
        content?: string
        created_at?: string | null
        id?: string
        idea_id?: string
        is_staff_reply?: boolean | null
        user_id?: string
      }
      Relationships: [
        {
          foreignKeyName: "idea_comments_idea_id_fkey"
          columns: ["idea_id"]
          isOneToOne: false
          referencedRelation: "ideas"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "idea_comments_user_id_fkey"
          columns: ["user_id"]
          isOneToOne: false
          referencedRelation: "users"
          referencedColumns: ["id"]
        }
      ]
    }
    tasks: {
      Row: {
        assigned_to: string | null
        created_at: string
        description: string | null
        due_date: string | null
        id: string
        property_id: string
        status: string
        title: string
        updated_at: string
      }
      Insert: {
        assigned_to?: string | null
        created_at?: string
        description?: string | null
        due_date?: string | null
        id?: string
        property_id: string
        status?: string
        title: string
        updated_at?: string
      }
      Update: {
        assigned_to?: string | null
        created_at?: string
        description?: string | null
        due_date?: string | null
        id?: string
        property_id?: string
        status?: string
        title?: string
        updated_at?: string
      }
      Relationships: [
        {
          foreignKeyName: "tasks_assigned_to_fkey"
          columns: ["assigned_to"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "tasks_property_id_fkey"
          columns: ["property_id"]
          isOneToOne: false
          referencedRelation: "properties"
          referencedColumns: ["id"]
        },
      ]
    }
    testimonials: {
      Row: {
        content: string
        created_at: string
        display_order: number | null
        id: string
        is_visible: boolean | null
        location: string | null
        name: string
        rating: number | null
        role: string | null
        updated_at: string
      }
      Insert: {
        content: string
        created_at?: string
        display_order?: number
        id?: string
        is_visible?: boolean
        location?: string | null
        name: string
        rating?: number
        role?: string | null
        updated_at?: string
      }
      Update: {
        content?: string
        created_at?: string
        display_order?: number
        id?: string
        is_visible?: boolean
        location?: string | null
        name?: string
        rating?: number
        role?: string | null
        updated_at?: string
      }
      Relationships: []
    }
    website_settings: {
      Row: {
        created_at: string
        id: string
        property_id: string
        setting_key: string
        setting_value: Json | null
        updated_at: string
      }
      Insert: {
        created_at?: string
        id?: string
        property_id: string
        setting_key: string
        setting_value?: Json | null
        updated_at?: string
      }
      Update: {
        created_at?: string
        id?: string
        property_id?: string
        setting_key?: string
        setting_value?: Json | null
        updated_at?: string
      }
      Relationships: [
        {
          foreignKeyName: "website_settings_property_id_fkey"
          columns: ["property_id"]
          isOneToOne: false
          referencedRelation: "properties"
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const