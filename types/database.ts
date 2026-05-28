export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "customer" | "admin";
export type OrderStatus =
  | "pending_confirmation"
  | "confirmed"
  | "in_preparation"
  | "out_for_delivery"
  | "ready_for_pickup"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";
export type PaymentStatus =
  | "pending"
  | "pending_transfer"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "cod"
  | "rejected";
export type FulfillmentType = "delivery" | "pickup";
export type PaymentMethod = "payhere" | "bank_transfer" | "cod";
export type CouponType = "percent" | "flat" | "free_delivery";
export type DietaryType = "eggless" | "vegan" | "gluten_free";
export type ReviewStatus = "pending" | "approved" | "hidden";
export type InquiryStatus =
  | "new"
  | "in_progress"
  | "quoted"
  | "accepted"
  | "rejected"
  | "completed";
export type LoyaltyTransactionType = "earn" | "redeem" | "bonus" | "expire" | "adjust";

type Relationships = [];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          role: UserRole;
          loyalty_points: number;
          blocked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          phone?: string | null;
          role?: UserRole;
          loyalty_points?: number;
          blocked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: Relationships;
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          recipient: string;
          phone: string;
          line1: string;
          line2: string | null;
          city: string;
          postal_code: string | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string;
          recipient: string;
          phone: string;
          line1: string;
          line2?: string | null;
          city: string;
          postal_code?: string | null;
          is_default?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>;
        Relationships: Relationships;
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          image_url: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: Relationships;
      };
      products: {
        Row: {
          id: string;
          slug: string;
          category_id: string | null;
          name: string;
          description: string | null;
          ingredients: string | null;
          allergens: string | null;
          base_price: string;
          is_published: boolean;
          is_featured: boolean;
          is_bestseller: boolean;
          stock_tracked: boolean;
          stock_quantity: number;
          low_stock_threshold: number;
          allows_message: boolean;
          allows_color_theme: boolean;
          allows_photo_upload: boolean;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          ingredients?: string | null;
          allergens?: string | null;
          base_price: string;
          is_published?: boolean;
          is_featured?: boolean;
          is_bestseller?: boolean;
          stock_tracked?: boolean;
          stock_quantity?: number;
          low_stock_threshold?: number;
          allows_message?: boolean;
          allows_color_theme?: boolean;
          allows_photo_upload?: boolean;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: Relationships;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          guest_email: string | null;
          guest_phone: string | null;
          status: OrderStatus;
          fulfillment_type: FulfillmentType;
          delivery_zone_id: string | null;
          address_snapshot: Json | null;
          delivery_date: string | null;
          time_slot_id: string | null;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          subtotal: string;
          delivery_fee: string;
          discount_amount: string;
          tax_amount: string;
          loyalty_points_used: number;
          loyalty_discount: string;
          total: string;
          coupon_id: string | null;
          notes: string | null;
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          user_id?: string | null;
          guest_email?: string | null;
          guest_phone?: string | null;
          status?: OrderStatus;
          fulfillment_type?: FulfillmentType;
          delivery_zone_id?: string | null;
          address_snapshot?: Json | null;
          delivery_date?: string | null;
          time_slot_id?: string | null;
          payment_method: PaymentMethod;
          payment_status?: PaymentStatus;
          subtotal: string;
          delivery_fee?: string;
          discount_amount?: string;
          tax_amount?: string;
          loyalty_points_used?: number;
          loyalty_discount?: string;
          total: string;
          coupon_id?: string | null;
          notes?: string | null;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: Relationships;
      };
      settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["settings"]["Insert"]>;
        Relationships: Relationships;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      fulfillment_type: FulfillmentType;
      payment_method: PaymentMethod;
      coupon_type: CouponType;
      dietary_type: DietaryType;
      review_status: ReviewStatus;
      inquiry_status: InquiryStatus;
      loyalty_transaction_type: LoyaltyTransactionType;
    };
    CompositeTypes: Record<string, never>;
  };
}
