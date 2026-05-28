import type { Metadata } from "next";
import { Container } from "@/components/shared/Container";

export const metadata: Metadata = { title: "My Account" };

export default function AccountPage() {
  return (
    <Container className="py-24 text-center">
      <p className="font-display text-2xl text-ink mb-2">My Account</p>
      <p className="body-base">Account features coming in Phase 4.</p>
    </Container>
  );
}
