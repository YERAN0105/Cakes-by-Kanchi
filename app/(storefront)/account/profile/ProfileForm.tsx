"use client";

import { useState, useTransition } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { updateProfileAction, changePasswordAction } from "@/lib/actions/account";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
  initialName: string;
  initialPhone: string;
  email: string;
}

export function ProfileForm({ initialName, initialPhone, email }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone.replace(/^\+94/, ""));
  const [profilePending, startProfileTransition] = useTransition();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordPending, startPasswordTransition] = useTransition();

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startProfileTransition(async () => {
      const result = await updateProfileAction({ name, phone });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Profile updated successfully.");
        router.refresh();
      }
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startPasswordTransition(async () => {
      const result = await changePasswordAction({ currentPassword, newPassword, confirmPassword });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Profile section */}
      <section>
        <h2 className="font-display text-lg font-semibold text-ink mb-5">Personal Details</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="profile-name" className="block text-sm font-body text-ink mb-1.5">Full Name</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-wine/30"
            />
          </div>

          <div>
            <label htmlFor="profile-email" className="block text-sm font-body text-ink mb-1.5">Email Address</label>
            <input
              id="profile-email"
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-blush-light/40 text-sm font-body text-ink-light cursor-not-allowed"
            />
            <p className="text-xs text-ink-light font-body mt-1">
              To change your email, please contact us.
            </p>
          </div>

          <div>
            <label htmlFor="profile-phone" className="block text-sm font-body text-ink mb-1.5">
              Phone Number <span className="text-ink-light">(optional)</span>
            </label>
            <div className="flex">
              <span className="px-3 py-2.5 bg-blush-light border border-r-0 border-border rounded-l-lg text-sm font-body text-ink-light">
                +94
              </span>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                placeholder="771234567"
                className="flex-1 px-3 py-2.5 rounded-r-lg border border-border bg-card text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-wine/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={profilePending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-wine text-cream text-sm font-body font-medium hover:bg-wine/90 disabled:opacity-60 transition-colors"
          >
            {profilePending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            Save Changes
          </button>
        </form>
      </section>

      <div className="h-px bg-border" />

      {/* Password section */}
      <section>
        <h2 className="font-display text-lg font-semibold text-ink mb-1">Change Password</h2>
        <p className="text-sm text-ink-light font-body mb-5">
          Leave blank if you don&apos;t want to change your password.
        </p>
        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="current-password" className="block text-sm font-body text-ink mb-1.5">Current Password</label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-card text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-wine/30"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={showCurrent ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink transition-colors"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="new-password" className="block text-sm font-body text-ink mb-1.5">New Password</label>
            <div className="relative">
              <input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-card text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-wine/30"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink transition-colors"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-ink-light font-body mt-1">Minimum 8 characters.</p>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-body text-ink mb-1.5">Confirm New Password</label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-card text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-wine/30"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-wine text-cream text-sm font-body font-medium hover:bg-wine/90 disabled:opacity-60 transition-colors"
          >
            {passwordPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            Update Password
          </button>
        </form>
      </section>
    </div>
  );
}
