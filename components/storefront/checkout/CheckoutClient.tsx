"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DayPicker } from "react-day-picker";
import { format, addDays, startOfDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Store,
  CreditCard,
  Building2,
  Banknote,
  Check,
  Loader2,
  MapPin,
  Calendar,
  Clock,
  Tag,
  X,
  AlertCircle,
  Shield,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, brand } from "@/lib/brand";
import { useCartStore } from "@/stores/cart";
import { createOrder, type CreateOrderPayload } from "@/lib/actions/order";
import { validateCoupon } from "@/lib/actions/cart";
import { Container } from "@/components/shared/Container";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

import "react-day-picker/dist/style.css";

type DeliveryZoneRow = Database["public"]["Tables"]["delivery_zones"]["Row"];
type TimeSlotRow = Database["public"]["Tables"]["time_slots"]["Row"];
type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

interface CheckoutUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  loyaltyPoints: number;
}

interface CheckoutClientProps {
  deliveryZones: DeliveryZoneRow[];
  timeSlots: TimeSlotRow[];
  holidays: { date: string; label: string | null }[];
  savedAddresses: AddressRow[];
  user: CheckoutUser | null;
}

// ── Zod schema ────────────────────────────────────────────────────

const checkoutSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Valid email required"),
    phone: z.string().regex(/^\d{9}$/, "Enter 9 digits after +94 (e.g. 771234567)"),
    fulfillmentType: z.enum(["delivery", "pickup"]),
    savedAddressId: z.string().optional(),
    recipientName: z.string().optional(),
    recipientPhone: z.string().optional().refine(
      (v) => !v || /^\d{9}$/.test(v),
      "Enter 9 digits after +94"
    ),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    saveAddress: z.boolean().optional(),
    addressLabel: z.enum(["Home", "Work", "Other"]).optional(),
    addressLabelCustom: z.string().max(20).optional(),
    deliveryZoneId: z.string().optional(),
    deliveryDate: z.string().min(1, "Please select a delivery date"),
    timeSlotId: z.string().min(1, "Please select a time slot"),
    notes: z.string().max(500).optional(),
    paymentMethod: z.enum(["payhere", "bank_transfer", "cod"], {
      required_error: "Please select a payment method",
    }),
    loyaltyPoints: z.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillmentType === "delivery") {
      if (!data.deliveryZoneId) {
        ctx.addIssue({ code: "custom", path: ["deliveryZoneId"], message: "Select a delivery zone" });
      }
      if (!data.savedAddressId) {
        if (!data.recipientName || data.recipientName.length < 2) {
          ctx.addIssue({ code: "custom", path: ["recipientName"], message: "Recipient name is required" });
        }
        if (!data.addressLine1 || data.addressLine1.length < 5) {
          ctx.addIssue({ code: "custom", path: ["addressLine1"], message: "Address is required" });
        }
        if (!data.city || data.city.length < 2) {
          ctx.addIssue({ code: "custom", path: ["city"], message: "City is required" });
        }
      }
    }
  });

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

// ── Component ─────────────────────────────────────────────────────

export function CheckoutClient({
  deliveryZones,
  timeSlots,
  savedAddresses,
  holidays,
  user,
}: CheckoutClientProps) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const clearCart = useCartStore((s) => s.clearCart);
  const storeCouponApply = useCartStore((s) => s.applyCoupon);
  const storeCouponRemove = useCartStore((s) => s.removeCoupon);
  const _hasHydrated = useCartStore((s) => s._hasHydrated);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [slotCapacityMap, setSlotCapacityMap] = useState<Record<string, number>>({});
  const orderPlaced = useRef(false);

  const defaultAddress = savedAddresses.find((a) => a.is_default) ?? savedAddresses[0] ?? null;

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: (user?.phone ?? "").replace(/^(\+94|0)/, ""),
      fulfillmentType: "delivery",
      loyaltyPoints: 0,
      savedAddressId: defaultAddress?.id ?? undefined,
      deliveryZoneId: defaultAddress?.delivery_zone_id ?? undefined,
    },
  });

  const values = watch();

  // Redirect if cart is empty after hydration (skip when order was just placed)
  useEffect(() => {
    if (_hasHydrated && items.length === 0 && !orderPlaced.current) {
      router.replace("/cart");
    }
  }, [_hasHydrated, items.length, router]);

  // Sync selected date with form
  useEffect(() => {
    if (selectedDate) {
      setValue("deliveryDate", format(selectedDate, "yyyy-MM-dd"), { shouldValidate: true });
    }
  }, [selectedDate, setValue]);

  // When form date is cleared, reset picker
  useEffect(() => {
    if (!values.deliveryDate) setSelectedDate(undefined);
  }, [values.deliveryDate]);

  // Fetch real slot usage whenever date changes
  useEffect(() => {
    if (!selectedDate) {
      setSlotCapacityMap({});
      return;
    }
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const controller = new AbortController();
    fetch(`/api/slots/capacity?date=${dateStr}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((body: { usage?: Record<string, number> }) => {
        if (body.usage) setSlotCapacityMap(body.usage);
      })
      .catch(() => {/* silently ignore — slots default to available */});
    return () => controller.abort();
  }, [selectedDate]);

  // Compute disabled dates
  const minDate = addDays(startOfDay(new Date()), 2);
  const holidayDates = holidays.map((h) => new Date(h.date + "T00:00:00"));
  const disabledDays = [{ before: minDate }, ...holidayDates];

  // Delivery fee
  const selectedZone = deliveryZones.find((z) => z.id === values.deliveryZoneId);
  const deliveryFee =
    values.fulfillmentType === "delivery" ? parseFloat(selectedZone?.fee ?? "0") : 0;

  // Coupon discount
  const isFreeDelivery = appliedCoupon?.type === "free_delivery";
  const effectiveDeliveryFee = isFreeDelivery ? 0 : deliveryFee;
  const couponDiscount = appliedCoupon?.discountAmount ?? 0;

  // Loyalty discount
  const loyaltyPointsAvailable = user?.loyaltyPoints ?? 0;
  const loyaltyPointsToUse = Math.min(values.loyaltyPoints ?? 0, loyaltyPointsAvailable);
  const loyaltyDiscount = loyaltyPointsToUse * 0.1;

  // Total
  const total = Math.max(0, subtotal + effectiveDeliveryFee - couponDiscount - loyaltyDiscount);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const result = await validateCoupon(couponInput, subtotal);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        storeCouponApply(result.coupon);
        toast.success(`Coupon "${result.coupon.code}" applied!`);
        setCouponInput("");
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    setIsSubmitting(true);
    try {
      const fullPhone = `+94${data.phone}`;
      const fullRecipientPhone = data.recipientPhone ? `+94${data.recipientPhone}` : fullPhone;

      const resolvedLabel =
        data.addressLabel === "Other"
          ? (data.addressLabelCustom?.trim() || "Other")
          : (data.addressLabel ?? "Home");

      const addressPayload =
        data.fulfillmentType === "delivery" && !data.savedAddressId
          ? {
              recipient: data.recipientName ?? "",
              phone: fullRecipientPhone,
              line1: data.addressLine1 ?? "",
              line2: data.addressLine2,
              city: data.city ?? "",
              postal_code: data.postalCode,
              label: resolvedLabel,
              save: data.saveAddress,
            }
          : undefined;

      const payload: CreateOrderPayload = {
        name: data.name,
        email: data.email,
        phone: fullPhone,
        fulfillmentType: data.fulfillmentType,
        deliveryZoneId: data.deliveryZoneId,
        savedAddressId: data.savedAddressId,
        address: addressPayload,
        deliveryDate: data.deliveryDate,
        timeSlotId: data.timeSlotId,
        notes: data.notes,
        paymentMethod: data.paymentMethod,
        loyaltyPointsToRedeem: loyaltyPointsToUse > 0 ? loyaltyPointsToUse : undefined,
        cartItems: items.map((item) => ({
          productId: item.productId,
          customization: item.customization,
        })),
        couponId: appliedCoupon?.id,
      };

      const result = await createOrder(payload);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      orderPlaced.current = true;
      clearCart();
      router.push(result.redirectUrl);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!_hasHydrated || items.length === 0) {
    return (
      <Container className="py-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-wine border-t-transparent animate-spin" />
      </Container>
    );
  }

  return (
    <Container className="py-10 lg:py-14">
      <h1 className="font-display text-3xl font-semibold text-ink mb-8">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Form sections ─────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── 1. Contact ───────────────────────── */}
            <SectionCard title="Contact Information" icon={<BadgeCheck className="w-5 h-5" />}>
              {user ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <p className="label-small text-ink-light mb-1">Full name</p>
                      <p className="text-sm font-body font-medium text-ink">{user.name}</p>
                    </div>
                    <div>
                      <p className="label-small text-ink-light mb-1">Email</p>
                      <p className="text-sm font-body text-ink">{user.email}</p>
                    </div>
                    <div>
                      <p className="label-small text-ink-light mb-1">Phone</p>
                      <p className="text-sm font-body text-ink">{user.phone ?? "—"}</p>
                    </div>
                  </div>
                  <p className="text-xs text-ink-light">
                    Wrong details?{" "}
                    <a href="/account/profile" className="text-wine hover:underline">
                      Update your profile
                    </a>
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <FieldLabel htmlFor="name">Full name</FieldLabel>
                      <input
                        id="name"
                        type="text"
                        autoComplete="name"
                        {...register("name")}
                        className={fieldCls(!!errors.name)}
                      />
                      <FieldError msg={errors.name?.message} />
                    </div>
                    <div>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        {...register("email")}
                        className={fieldCls(!!errors.email)}
                      />
                      <FieldError msg={errors.email?.message} />
                    </div>
                    <div>
                      <FieldLabel htmlFor="phone">Phone</FieldLabel>
                      <div className={cn(
                        "flex rounded-lg border overflow-hidden transition-colors",
                        "focus-within:ring-1 focus-within:ring-wine bg-cream",
                        errors.phone ? "border-destructive" : "border-border hover:border-wine/40"
                      )}>
                        <span className="flex items-center px-3 bg-blush-light text-ink-light text-sm font-body border-r border-border select-none shrink-0">
                          +94
                        </span>
                        <input
                          id="phone"
                          type="tel"
                          autoComplete="tel"
                          maxLength={9}
                          placeholder="771234567"
                          {...register("phone")}
                          className="flex-1 px-3 py-2.5 bg-cream text-sm font-body text-ink placeholder:text-ink-light focus:outline-none"
                        />
                      </div>
                      <FieldError msg={errors.phone?.message} />
                    </div>
                  </div>
                  <p className="text-xs text-ink-light mt-2">
                    Already have an account?{" "}
                    <a href="/login?redirect=/checkout" className="text-wine hover:underline">
                      Log in
                    </a>
                  </p>
                </>
              )}
            </SectionCard>

            {/* ── 2. Fulfillment Type ──────────────── */}
            <SectionCard title="Delivery or Pickup" icon={<Truck className="w-5 h-5" />}>
              <Controller
                name="fulfillmentType"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-3">
                    {(["delivery", "pickup"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          field.onChange(type);
                          setValue("deliveryZoneId", undefined);
                          setValue("savedAddressId", undefined);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                          field.value === type
                            ? "border-wine bg-wine/5 text-wine"
                            : "border-border text-ink hover:border-wine/40"
                        )}
                        aria-pressed={field.value === type}
                      >
                        {type === "delivery" ? (
                          <Truck className="w-6 h-6" aria-hidden="true" />
                        ) : (
                          <Store className="w-6 h-6" aria-hidden="true" />
                        )}
                        <span className="font-body font-medium capitalize text-sm">{type}</span>
                      </button>
                    ))}
                  </div>
                )}
              />
            </SectionCard>

            {/* ── 3a. Delivery Details ─────────────── */}
            <AnimatePresence initial={false}>
              {values.fulfillmentType === "delivery" && (
                <motion.div
                  key="delivery-section"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <SectionCard title="Delivery Details" icon={<MapPin className="w-5 h-5" />}>
                    {/* Saved addresses — shown first when user has any */}
                    {user && savedAddresses.length > 0 && (
                      <div>
                        <p className="label-small text-ink mb-2">Deliver to</p>
                        <div className="space-y-2">
                          {savedAddresses.map((addr) => {
                            const isSelected = values.savedAddressId === addr.id;
                            const zone = deliveryZones.find((z) => z.id === addr.delivery_zone_id);
                            return (
                              <label
                                key={addr.id}
                                className={cn(
                                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                  isSelected
                                    ? "border-wine bg-wine/5"
                                    : "border-border hover:border-wine/40"
                                )}
                              >
                                <input
                                  type="radio"
                                  name="savedAddressId"
                                  value={addr.id}
                                  checked={isSelected}
                                  onChange={() => {
                                    setValue("savedAddressId", addr.id);
                                    if (addr.delivery_zone_id) {
                                      setValue("deliveryZoneId", addr.delivery_zone_id);
                                    }
                                  }}
                                  className="mt-1 accent-wine"
                                />
                                <div className="text-sm font-body">
                                  <p className="font-medium text-ink">
                                    {addr.label} — {addr.recipient}
                                  </p>
                                  <p className="text-ink-light">
                                    {addr.line1}
                                    {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}
                                    {addr.postal_code ? ` ${addr.postal_code}` : ""}
                                  </p>
                                  {addr.phone && (
                                    <p className="text-ink-light">{addr.phone}</p>
                                  )}
                                  {zone && (
                                    <p className="text-xs text-wine mt-0.5">
                                      {zone.name} — {formatCurrency(parseFloat(zone.fee))}
                                    </p>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                          <label
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all text-sm font-body text-wine",
                              !values.savedAddressId
                                ? "border-wine bg-wine/5"
                                : "border-border hover:border-wine/40"
                            )}
                          >
                            <input
                              type="radio"
                              name="savedAddressId"
                              value=""
                              checked={!values.savedAddressId}
                              onChange={() => {
                                setValue("savedAddressId", undefined);
                                setValue("deliveryZoneId", undefined);
                              }}
                              className="accent-wine"
                            />
                            + Add a new address
                          </label>
                        </div>
                      </div>
                    )}

                    {/* New address fields — zone dropdown appears here for new addresses */}
                    {!values.savedAddressId && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <FieldLabel htmlFor="zone">Delivery zone</FieldLabel>
                          <Controller
                            name="deliveryZoneId"
                            control={control}
                            render={({ field }) => (
                              <div className="relative">
                                <select
                                  id="zone"
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || undefined)}
                                  className={cn(fieldCls(!!errors.deliveryZoneId), "appearance-none pr-9")}
                                >
                                  <option value="">Select a zone…</option>
                                  {deliveryZones.map((zone) => (
                                    <option key={zone.id} value={zone.id}>
                                      {zone.name} — {formatCurrency(parseFloat(zone.fee))}
                                      {zone.estimated_time ? ` (${zone.estimated_time})` : ""}
                                    </option>
                                  ))}
                                </select>
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                              </div>
                            )}
                          />
                          <FieldError msg={errors.deliveryZoneId?.message} />
                        </div>
                        <div className="sm:col-span-2">
                          <FieldLabel htmlFor="recipientName">Recipient name</FieldLabel>
                          <input
                            id="recipientName"
                            type="text"
                            {...register("recipientName")}
                            className={fieldCls(!!errors.recipientName)}
                          />
                          <FieldError msg={errors.recipientName?.message} />
                        </div>
                        <div>
                          <FieldLabel htmlFor="recipientPhone">Recipient phone</FieldLabel>
                          <div className={cn(
                            "flex rounded-lg border overflow-hidden transition-colors",
                            "focus-within:ring-1 focus-within:ring-wine bg-cream",
                            errors.recipientPhone ? "border-destructive" : "border-border hover:border-wine/40"
                          )}>
                            <span className="flex items-center px-3 bg-blush-light text-ink-light text-sm font-body border-r border-border select-none shrink-0">
                              +94
                            </span>
                            <input
                              id="recipientPhone"
                              type="tel"
                              maxLength={9}
                              placeholder="771234567"
                              {...register("recipientPhone")}
                              className="flex-1 px-3 py-2.5 bg-cream text-sm font-body text-ink placeholder:text-ink-light focus:outline-none"
                            />
                          </div>
                          <FieldError msg={errors.recipientPhone?.message} />
                        </div>
                        <div>
                          <FieldLabel htmlFor="addressCity">City</FieldLabel>
                          <input
                            id="addressCity"
                            type="text"
                            {...register("city")}
                            className={fieldCls(!!errors.city)}
                          />
                          <FieldError msg={errors.city?.message} />
                        </div>
                        <div className="sm:col-span-2">
                          <FieldLabel htmlFor="addressLine1">Address line 1</FieldLabel>
                          <input
                            id="addressLine1"
                            type="text"
                            placeholder="No. 42, Flower Road"
                            {...register("addressLine1")}
                            className={fieldCls(!!errors.addressLine1)}
                          />
                          <FieldError msg={errors.addressLine1?.message} />
                        </div>
                        <div className="sm:col-span-2">
                          <FieldLabel htmlFor="addressLine2">
                            Address line 2{" "}
                            <span className="font-normal text-ink-light">(optional)</span>
                          </FieldLabel>
                          <input
                            id="addressLine2"
                            type="text"
                            {...register("addressLine2")}
                            className={fieldCls(false)}
                          />
                        </div>
                        <div>
                          <FieldLabel htmlFor="postalCode">
                            Postal code{" "}
                            <span className="font-normal text-ink-light">(optional)</span>
                          </FieldLabel>
                          <input
                            id="postalCode"
                            type="text"
                            {...register("postalCode")}
                            className={fieldCls(false)}
                          />
                        </div>
                        {user && (
                          <div className="sm:col-span-2 space-y-3">
                            <div className="flex items-center gap-2">
                              <input
                                id="saveAddress"
                                type="checkbox"
                                {...register("saveAddress")}
                                className="accent-wine"
                              />
                              <label
                                htmlFor="saveAddress"
                                className="text-sm font-body text-ink cursor-pointer"
                              >
                                Save this address to my account
                              </label>
                            </div>
                            {values.saveAddress && (
                              <div className="space-y-2 pl-5">
                                <p className="text-xs font-body text-ink-light">Label this address</p>
                                <div className="flex gap-2 flex-wrap">
                                  {(["Home", "Work", "Other"] as const).map((lbl) => (
                                    <button
                                      key={lbl}
                                      type="button"
                                      onClick={() => setValue("addressLabel", lbl)}
                                      className={cn(
                                        "px-3 py-1 rounded-full text-xs font-body border transition-colors",
                                        values.addressLabel === lbl || (!values.addressLabel && lbl === "Home")
                                          ? "bg-wine text-cream border-wine"
                                          : "bg-cream text-ink border-border hover:border-wine/50"
                                      )}
                                    >
                                      {lbl}
                                    </button>
                                  ))}
                                </div>
                                {(values.addressLabel === "Other") && (
                                  <input
                                    type="text"
                                    {...register("addressLabelCustom")}
                                    placeholder="e.g. Parents' house"
                                    maxLength={20}
                                    className={cn(fieldCls(false), "max-w-xs")}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </SectionCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── 3b. Pickup Details ───────────────── */}
            <AnimatePresence initial={false}>
              {values.fulfillmentType === "pickup" && (
                <motion.div
                  key="pickup-section"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <SectionCard title="Pickup Details" icon={<Store className="w-5 h-5" />}>
                    <div className="rounded-xl overflow-hidden border border-blush">
                      <iframe
                        src={brand.mapEmbedUrl}
                        width="100%"
                        height="200"
                        loading="lazy"
                        title="Shop location"
                        className="block border-0"
                      />
                      <div className="p-4 bg-blush-light space-y-0.5">
                        <p className="font-body font-semibold text-ink">{brand.name}</p>
                        <p className="text-sm text-ink-light">
                          {brand.address.line1}, {brand.address.line2}
                        </p>
                        <p className="text-sm text-ink-light">{brand.businessHours}</p>
                        <a
                          href={brand.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-xs text-wine hover:underline pt-1"
                        >
                          Open in Google Maps →
                        </a>
                      </div>
                    </div>
                  </SectionCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── 4. Date & Slot ───────────────────── */}
            <SectionCard title="Date & Time" icon={<Calendar className="w-5 h-5" />}>
              <p className="text-xs text-ink-light mb-3">
                Orders must be placed at least 2 days in advance. Large orders: 5+ days.
              </p>

              {/* Date picker */}
              <div className="mb-4">
                <p className="label-small text-ink mb-2">
                  {values.fulfillmentType === "pickup" ? "Pickup date" : "Delivery date"}
                </p>
                <div className="overflow-x-auto">
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(day) => {
                      setSelectedDate(day);
                      setValue("timeSlotId", "");
                    }}
                    disabled={disabledDays}
                    fromDate={minDate}
                    modifiersClassNames={{
                      selected: "rdp-selected",
                      today: "rdp-today",
                    }}
                    className="rdp-brand"
                  />
                </div>
                {values.deliveryDate && (
                  <p className="text-sm text-ink mt-1">
                    Selected:{" "}
                    <span className="font-medium text-wine">
                      {format(new Date(values.deliveryDate), "EEEE, d MMMM yyyy")}
                    </span>
                  </p>
                )}
                <FieldError msg={errors.deliveryDate?.message} />
              </div>

              {/* Time slot */}
              {values.deliveryDate && (
                <div>
                  <p className="label-small text-ink mb-2">
                    <Clock className="inline w-3.5 h-3.5 mr-1" aria-hidden="true" />
                    Time slot
                  </p>
                  <Controller
                    name="timeSlotId"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {timeSlots.map((slot) => {
                          const used = slotCapacityMap[slot.id] ?? 0;
                          const remaining = slot.capacity - used;
                          const isFull = remaining <= 0;
                          const isSelected = field.value === slot.id;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              disabled={isFull}
                              onClick={() => field.onChange(slot.id)}
                              className={cn(
                                "p-3 rounded-lg border text-left transition-all text-sm",
                                isSelected
                                  ? "border-wine bg-wine/5 text-wine"
                                  : isFull
                                    ? "border-border bg-cream/50 text-ink-light opacity-50 cursor-not-allowed"
                                    : "border-border text-ink hover:border-wine/40"
                              )}
                              aria-pressed={isSelected}
                            >
                              <p className="font-body font-medium">{slot.label}</p>
                              <p className="text-xs text-ink-light mt-0.5">
                                {isFull
                                  ? "Fully booked"
                                  : remaining <= 3
                                    ? `${remaining} slot${remaining === 1 ? "" : "s"} left`
                                    : "Available"}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                  <FieldError msg={errors.timeSlotId?.message} />
                </div>
              )}

              {/* Notes */}
              <div className="mt-4">
                <FieldLabel htmlFor="notes">
                  Order notes{" "}
                  <span className="font-normal text-ink-light">(optional)</span>
                </FieldLabel>
                <textarea
                  id="notes"
                  rows={2}
                  maxLength={500}
                  placeholder="Any special delivery instructions…"
                  {...register("notes")}
                  className={cn(fieldCls(false), "resize-none")}
                />
              </div>
            </SectionCard>

            {/* ── 5. Payment ───────────────────────── */}
            <SectionCard title="Payment Method" icon={<CreditCard className="w-5 h-5" />}>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    {/* PayHere */}
                    <PaymentOption
                      selected={field.value === "payhere"}
                      onSelect={() => field.onChange("payhere")}
                      icon={<CreditCard className="w-5 h-5 text-wine" />}
                      title="Pay Online"
                      description="Cards, eZ Cash, mCash — secure PayHere gateway"
                      badge="Recommended"
                    />
                    {/* Bank Transfer */}
                    <PaymentOption
                      selected={field.value === "bank_transfer"}
                      onSelect={() => field.onChange("bank_transfer")}
                      icon={<Building2 className="w-5 h-5 text-wine" />}
                      title="Bank Transfer"
                      description="Upload receipt after placing your order"
                    />
                    {/* COD — delivery only */}
                    {values.fulfillmentType === "delivery" && (
                      <PaymentOption
                        selected={field.value === "cod"}
                        onSelect={() => field.onChange("cod")}
                        icon={<Banknote className="w-5 h-5 text-wine" />}
                        title="Cash on Delivery"
                        description="Pay in cash when your order arrives"
                      />
                    )}
                  </div>
                )}
              />
              {errors.paymentMethod && (
                <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.paymentMethod.message}
                </p>
              )}
            </SectionCard>
          </div>

          {/* ── Right: Order Summary ─────────────────── */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 lg:sticky lg:top-24">
              <h2 className="font-display text-lg font-semibold text-ink">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.cartItemId} className="flex gap-2 text-sm font-body">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink line-clamp-1">
                        {item.snapshot.name}
                        {item.customization.quantity > 1 && (
                          <span className="ml-1.5 text-xs font-semibold text-wine">
                            ×{item.customization.quantity}
                          </span>
                        )}
                      </p>
                      {item.customizationSummary.length > 0 && (
                        <p className="text-xs text-ink-light line-clamp-1">
                          {item.customizationSummary.slice(0, 3).join(" · ")}
                        </p>
                      )}
                    </div>
                    <p className="font-medium text-wine shrink-0">{formatCurrency(item.lineTotal)}</p>
                  </div>
                ))}
              </div>

              <div className="h-px bg-border" />

              {/* Coupon */}
              {appliedCoupon ? (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-wine/5 border border-wine/20">
                  <Tag className="w-4 h-4 text-wine shrink-0" aria-hidden="true" />
                  <div className="flex-1 text-sm font-body">
                    <span className="font-medium text-wine">{appliedCoupon.code}</span>
                    <span className="text-ink-light ml-1">
                      (−{formatCurrency(appliedCoupon.discountAmount)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={storeCouponRemove}
                    aria-label="Remove coupon"
                    className="text-ink-light hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    placeholder="Coupon code"
                    aria-label="Coupon code"
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-cream text-sm font-body text-ink placeholder:text-ink-light focus:outline-none focus:ring-1 focus:ring-wine"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="px-3 py-2 rounded-lg text-sm font-body font-medium bg-wine text-cream hover:bg-wine/90 disabled:opacity-50 transition-colors"
                  >
                    {couponLoading ? "…" : "Apply"}
                  </button>
                </div>
              )}

              {/* Loyalty points */}
              {user && loyaltyPointsAvailable > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-body text-ink">
                    Loyalty points:{" "}
                    <span className="font-medium text-wine">{loyaltyPointsAvailable} pts</span>
                  </p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min={0}
                      max={loyaltyPointsAvailable}
                      placeholder="Points to redeem"
                      {...register("loyaltyPoints", { valueAsNumber: true })}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-cream text-sm font-body text-ink focus:outline-none focus:ring-1 focus:ring-wine"
                    />
                    {loyaltyPointsToUse > 0 && (
                      <span className="text-sm text-wine font-medium shrink-0">
                        −{formatCurrency(loyaltyDiscount)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-light">1 pt = Rs. 0.10</p>
                </div>
              )}

              <div className="h-px bg-border" />

              {/* Totals */}
              <div className="space-y-2 text-sm font-body">
                <div className="flex justify-between">
                  <span className="text-ink-light">Subtotal</span>
                  <span className="text-ink">{formatCurrency(subtotal)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-ink-light">Delivery</span>
                    {isFreeDelivery ? (
                      <span className="text-wine font-medium">Free</span>
                    ) : (
                      <span className="text-ink">{formatCurrency(deliveryFee)}</span>
                    )}
                  </div>
                )}
                {values.fulfillmentType === "pickup" && (
                  <div className="flex justify-between">
                    <span className="text-ink-light">Delivery</span>
                    <span className="text-wine font-medium">Free (Pickup)</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-wine">Coupon</span>
                    <span className="text-wine">−{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-wine">Loyalty</span>
                    <span className="text-wine">−{formatCurrency(loyaltyDiscount)}</span>
                  </div>
                )}
                <div className="h-px bg-border" />
                <div className="flex justify-between font-semibold">
                  <span className="text-ink">Total</span>
                  <span className="font-display text-xl text-wine">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Place Order */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full text-center py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Placing Order…
                  </>
                ) : (
                  `Place Order — ${formatCurrency(total)}`
                )}
              </button>

              {/* Reassurance */}
              <div className="flex flex-col gap-1.5 text-xs text-ink-light">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Secure & encrypted checkout</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Freshness guaranteed on every order</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Container>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
        <span className="text-wine" aria-hidden="true">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="label-small text-ink mb-1.5 block">
      {children}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
      {msg}
    </p>
  );
}

function fieldCls(hasError: boolean) {
  return cn(
    "w-full px-3 py-2.5 rounded-lg border text-sm font-body text-ink placeholder:text-ink-light",
    "focus:outline-none focus:ring-1 focus:ring-wine bg-cream transition-colors",
    hasError ? "border-destructive" : "border-border hover:border-wine/40"
  );
}

function PaymentOption({
  selected,
  onSelect,
  icon,
  title,
  description,
  badge,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
        selected ? "border-wine bg-wine/5" : "border-border hover:border-wine/40"
      )}
      aria-pressed={selected}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          selected ? "bg-wine/10" : "bg-blush-light"
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-body font-semibold text-sm text-ink">{title}</p>
          {badge && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-wine text-cream">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-ink-light mt-0.5">{description}</p>
      </div>
      <div
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
          selected ? "border-wine bg-wine" : "border-border"
        )}
      >
        {selected && <Check className="w-3 h-3 text-cream" aria-hidden="true" />}
      </div>
    </button>
  );
}
