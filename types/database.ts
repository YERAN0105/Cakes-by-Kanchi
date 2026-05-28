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
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt_text: string | null;
          display_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt_text?: string | null;
          display_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
        Relationships: Relationships;
      };
      product_sizes: {
        Row: {
          id: string;
          product_id: string;
          label: string;
          weight_kg: string | null;
          price: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          label: string;
          weight_kg?: string | null;
          price: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_sizes"]["Insert"]>;
        Relationships: Relationships;
      };
      product_shapes: {
        Row: {
          id: string;
          product_id: string;
          shape: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          shape: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_shapes"]["Insert"]>;
        Relationships: Relationships;
      };
      product_flavors: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          price_modifier: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          price_modifier?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_flavors"]["Insert"]>;
        Relationships: Relationships;
      };
      product_tier_options: {
        Row: {
          id: string;
          product_id: string;
          tier_count: number;
          price_modifier: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          tier_count: number;
          price_modifier?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_tier_options"]["Insert"]>;
        Relationships: Relationships;
      };
      product_dietary_options: {
        Row: {
          id: string;
          product_id: string;
          type: DietaryType;
          price_modifier: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          type: DietaryType;
          price_modifier?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_dietary_options"]["Insert"]>;
        Relationships: Relationships;
      };
      addons: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          price: string;
          stock_tracked: boolean;
          stock_quantity: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          price: string;
          stock_tracked?: boolean;
          stock_quantity?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["addons"]["Insert"]>;
        Relationships: Relationships;
      };
      product_addons: {
        Row: {
          product_id: string;
          addon_id: string;
        };
        Insert: {
          product_id: string;
          addon_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_addons"]["Insert"]>;
        Relationships: Relationships;
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          type: CouponType;
          value: string;
          min_order_amount: string | null;
          max_discount: string | null;
          usage_limit_total: number | null;
          usage_limit_per_user: number | null;
          valid_from: string | null;
          valid_until: string | null;
          applies_to: Json | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          type: CouponType;
          value: string;
          min_order_amount?: string | null;
          max_discount?: string | null;
          usage_limit_total?: number | null;
          usage_limit_per_user?: number | null;
          valid_from?: string | null;
          valid_until?: string | null;
          applies_to?: Json | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["coupons"]["Insert"]>;
        Relationships: Relationships;
      };
      coupon_usage: {
        Row: {
          id: string;
          coupon_id: string;
          order_id: string | null;
          user_id: string | null;
          used_at: string;
        };
        Insert: {
          id?: string;
          coupon_id: string;
          order_id?: string | null;
          user_id?: string | null;
          used_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["coupon_usage"]["Insert"]>;
        Relationships: Relationships;
      };
      delivery_zones: {
        Row: {
          id: string;
          name: string;
          fee: string;
          estimated_time: string | null;
          min_order_amount: string | null;
          same_day_surcharge: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          fee: string;
          estimated_time?: string | null;
          min_order_amount?: string | null;
          same_day_surcharge?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["delivery_zones"]["Insert"]>;
        Relationships: Relationships;
      };
      time_slots: {
        Row: {
          id: string;
          label: string;
          start_time: string;
          end_time: string;
          capacity: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          start_time: string;
          end_time: string;
          capacity?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["time_slots"]["Insert"]>;
        Relationships: Relationships;
      };
      holidays: {
        Row: {
          id: string;
          date: string;
          label: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          label?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["holidays"]["Insert"]>;
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
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_snapshot: Json;
          customization: Json;
          quantity: number;
          unit_price: string;
          line_total: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_snapshot: Json;
          customization?: Json;
          quantity?: number;
          unit_price: string;
          line_total: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: Relationships;
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: OrderStatus;
          note: string | null;
          changed_by: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          status: OrderStatus;
          note?: string | null;
          changed_by?: string | null;
          changed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_status_history"]["Insert"]>;
        Relationships: Relationships;
      };
      bank_transfer_receipts: {
        Row: {
          id: string;
          order_id: string;
          image_url: string;
          uploaded_at: string;
          status: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          reject_reason: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          image_url: string;
          uploaded_at?: string;
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          reject_reason?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["bank_transfer_receipts"]["Insert"]>;
        Relationships: Relationships;
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          gateway: string;
          gateway_transaction_id: string | null;
          amount: string;
          status: string;
          raw_response: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          gateway: string;
          gateway_transaction_id?: string | null;
          amount: string;
          status: string;
          raw_response?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: Relationships;
      };
      custom_inquiries: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          event_date: string | null;
          occasion: string | null;
          servings: number | null;
          description: string | null;
          budget_min: string | null;
          budget_max: string | null;
          special_requirements: string | null;
          status: InquiryStatus;
          quoted_amount: string | null;
          quote_message: string | null;
          payment_link: string | null;
          converted_order_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone: string;
          event_date?: string | null;
          occasion?: string | null;
          servings?: number | null;
          description?: string | null;
          budget_min?: string | null;
          budget_max?: string | null;
          special_requirements?: string | null;
          status?: InquiryStatus;
          quoted_amount?: string | null;
          quote_message?: string | null;
          payment_link?: string | null;
          converted_order_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["custom_inquiries"]["Insert"]>;
        Relationships: Relationships;
      };
      custom_inquiry_images: {
        Row: {
          id: string;
          inquiry_id: string;
          url: string;
        };
        Insert: {
          id?: string;
          inquiry_id: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["custom_inquiry_images"]["Insert"]>;
        Relationships: Relationships;
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string | null;
          order_item_id: string | null;
          rating: number;
          title: string | null;
          body: string | null;
          status: ReviewStatus;
          admin_reply: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id?: string | null;
          order_item_id?: string | null;
          rating: number;
          title?: string | null;
          body?: string | null;
          status?: ReviewStatus;
          admin_reply?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
        Relationships: Relationships;
      };
      review_images: {
        Row: {
          id: string;
          review_id: string;
          url: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["review_images"]["Insert"]>;
        Relationships: Relationships;
      };
      wishlist: {
        Row: {
          user_id: string;
          product_id: string;
          added_at: string;
        };
        Insert: {
          user_id: string;
          product_id: string;
          added_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wishlist"]["Insert"]>;
        Relationships: Relationships;
      };
      loyalty_transactions: {
        Row: {
          id: string;
          user_id: string;
          order_id: string | null;
          type: LoyaltyTransactionType;
          points: number;
          balance_after: number;
          note: string | null;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_id?: string | null;
          type: LoyaltyTransactionType;
          points: number;
          balance_after: number;
          note?: string | null;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["loyalty_transactions"]["Insert"]>;
        Relationships: Relationships;
      };
      banners: {
        Row: {
          id: string;
          image_url: string;
          headline: string | null;
          subheadline: string | null;
          cta_text: string | null;
          cta_link: string | null;
          position: string;
          display_order: number;
          valid_from: string | null;
          valid_until: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          headline?: string | null;
          subheadline?: string | null;
          cta_text?: string | null;
          cta_link?: string | null;
          position?: string;
          display_order?: number;
          valid_from?: string | null;
          valid_until?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["banners"]["Insert"]>;
        Relationships: Relationships;
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          subscribed_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          subscribed_at?: string;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["newsletter_subscribers"]["Insert"]>;
        Relationships: Relationships;
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          target_table: string | null;
          target_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          target_table?: string | null;
          target_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Insert"]>;
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

// ── Derived convenience types ──────────────────────────────────

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
export type ProductSizeRow = Database["public"]["Tables"]["product_sizes"]["Row"];
export type ProductShapeRow = Database["public"]["Tables"]["product_shapes"]["Row"];
export type ProductFlavorRow = Database["public"]["Tables"]["product_flavors"]["Row"];
export type ProductTierOptionRow = Database["public"]["Tables"]["product_tier_options"]["Row"];
export type ProductDietaryOptionRow = Database["public"]["Tables"]["product_dietary_options"]["Row"];
export type AddonRow = Database["public"]["Tables"]["addons"]["Row"];
export type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

/** Full product with all joined data — used on the product detail page */
export interface ProductWithDetails extends ProductRow {
  categories: CategoryRow | null;
  product_images: ProductImageRow[];
  product_sizes: ProductSizeRow[];
  product_shapes: ProductShapeRow[];
  product_flavors: ProductFlavorRow[];
  product_tier_options: ProductTierOptionRow[];
  product_dietary_options: ProductDietaryOptionRow[];
  product_addons: { addons: AddonRow }[];
}

/** Lightweight product for catalog grid cards */
export interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  base_price: string;
  is_featured: boolean;
  is_bestseller: boolean;
  stock_tracked: boolean;
  stock_quantity: number;
  categories: { id: string; slug: string; name: string } | null;
  product_images: { url: string; is_primary: boolean; alt_text: string | null }[];
  product_sizes: { price: string }[];
}

/** Applied coupon with computed discount — shared between cart store and server actions */
export interface AppliedCoupon {
  id: string;
  code: string;
  type: "percent" | "flat" | "free_delivery";
  value: number;
  discountAmount: number;
}

/** Address snapshot stored on an order at placement time */
export interface AddressSnapshot {
  recipient: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  postal_code?: string | null;
  label?: string;
}

/** Product snapshot stored on order_items at placement time */
export interface ProductSnapshot {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  sizeName: string;
  sizePrice: number;
  flavorName: string | null;
  tierName: string | null;
}
