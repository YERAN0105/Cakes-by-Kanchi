# 🎂 How to Use These Prompts with Claude Code

This package contains everything Claude Code needs to build your premium cake shop e-commerce platform.

## 📁 Files in This Package

| File | Purpose |
|---|---|
| `MASTER_SPEC.md` | The **source of truth** for the entire project. Comprehensive spec covering goals, tech stack, design direction, features, schema, payments, notifications, and quality standards. |
| `PHASE_1.md` | Foundation: setup, auth, DB schema, brand design system, base layout |
| `PHASE_2.md` | Product system: catalog, search, product detail with deep customization (read-only — no cart yet) |
| `PHASE_3.md` | Cart, checkout, and orders: cart state, checkout flow, PayHere, bank transfer, COD |
| `PHASE_4.md` | Customer account: orders, addresses, wishlist (DB-backed), loyalty points, reviews |
| `PHASE_5.md` | Admin panel: dashboard, products, orders, customers, inquiries, coupons, banners, settings, logs |
| `PHASE_6.md` | Notifications (email + WhatsApp), polish, SEO, performance, accessibility, deployment |

---

## 🚀 Step-by-Step Workflow

### Step 1: Set Up Your Environment

Before you write a single line of code, you'll need:

1. **A new empty Git repository** (local or on GitHub)
2. **Node.js 20+** installed
3. **A Supabase account** — create a new project (free tier is fine to start)
4. **A Google Cloud project** with OAuth credentials (for Google login)
5. **A PayHere merchant account** — sign up at https://payhere.lk (sandbox works initially)
6. **A Resend account** — for email (free tier: 100 emails/day, 3000/month)
7. **A Meta Business / WhatsApp Cloud API account** — start this early, template approval takes ~24h
8. **Claude Code installed** — see https://docs.claude.com/claude-code

### Step 2: Drop the Spec Files into Your Project

```bash
# In your new empty project directory
mkdir docs
# Copy MASTER_SPEC.md to the project root
# Copy all PHASE_*.md files to docs/
```

Your project should look like:
```
my-cake-shop/
├── MASTER_SPEC.md            ← project root
└── docs/
    ├── PHASE_1.md
    ├── PHASE_2.md
    ├── PHASE_3.md
    ├── PHASE_4.md
    ├── PHASE_5.md
    └── PHASE_6.md
```

### Step 3: Run Each Phase, One at a Time

Open Claude Code in your project directory. For **each phase**, send a message like this:

```
Read MASTER_SPEC.md in the project root, then read docs/PHASE_1.md and execute Phase 1 in full. Build only what's in Phase 1 — do not start on later phases. When you finish, walk me through the Phase 1 Completion Checklist and confirm each item.
```

Then for Phase 2:
```
Phase 1 is complete and verified. Now read MASTER_SPEC.md again to refresh context, then read docs/PHASE_2.md and execute Phase 2 in full. Stay strictly within Phase 2 scope.
```

…and so on for Phases 3 through 6.

### Step 4: Verify Each Phase Before Moving On

Each phase ends with a **Completion Checklist**. **Do not move to the next phase until every item is verified.**

For example, after Phase 1:
- Run `npm run dev` and visit `localhost:3000` — does the homepage look boutique?
- Can you register, log in, and reset password?
- Did the admin user get seeded?
- Open Supabase dashboard — did all tables get created with RLS?

If anything is broken or sub-standard, ask Claude Code to fix it before continuing.

### Step 5: Iterate

Claude Code does its best work when you give targeted feedback. After Phase 1, you might say:

```
The hero section looks too generic. Make the typography more dramatic — increase the headline size, add more letter-spacing to the eyebrow text, and give it a subtle decorative line above the headline. The image should have a soft warm overlay.
```

Iterate on each phase until you're happy, then move on.

---

## 💡 Tips for Best Results with Claude Code

### Keep the Spec Files Updated
If you change your mind on something (e.g., add a feature or remove one), update `MASTER_SPEC.md` first, then tell Claude Code to read the updated spec before continuing.

### Use Phase Files as Acceptance Criteria
The checklists in each phase are your acceptance criteria. Ask Claude Code to **explicitly verify each checklist item** before declaring a phase done.

### Don't Skip Phases
The phases are ordered for a reason — each one depends on the previous. Skipping or reordering will lead to messy code and rework.

### Watch the Token Budget
Each phase is sized to fit a focused Claude Code session. If you run into context limits, summarize what's been built and continue with a fresh session.

### Brand-Specific Tweaks
The spec says "Cakery" as a placeholder brand name. Once you have your real brand, update `lib/brand.ts` (which Claude will create in Phase 1) and the colors/fonts in one place — everything updates automatically.

### Real Data Setup
The seed scripts use placeholder images from Unsplash. Once Phase 5 (admin) is built, you can upload your real cake photos through the admin product editor and delete the seeded products.

---

## 🆘 If You Get Stuck

### Claude Code is going off-spec
Remind it: "Re-read MASTER_SPEC.md §X. You're doing Y, but the spec says Z."

### A phase is taking too long / too big
Break it into smaller tasks within the phase. Run the phase prompt in parts: "Do tasks 1-5 of Phase 3 only."

### Something's broken
Ask Claude Code to debug with a specific reproduction: "When I click X, I get error Y. Here's the stack trace. Fix it without changing unrelated code."

### You want to add a feature later
That's normal. After v1 is launched, treat new features as their own mini-phases:
```
Read MASTER_SPEC.md. I want to add [feature]. Plan the changes (DB schema, UI, server actions) and confirm with me before implementing.
```

---

## 🎯 Expected Build Time

If you work through this with Claude Code attentively (verifying each phase, providing feedback):

- **Phase 1:** 1–2 sessions
- **Phase 2:** 2–3 sessions
- **Phase 3:** 3–4 sessions (payments are the trickiest)
- **Phase 4:** 2 sessions
- **Phase 5:** 4–6 sessions (admin is broad)
- **Phase 6:** 2–3 sessions

**Total: ~14–20 Claude Code sessions over 2–4 weeks of evenings/weekends.**

---

## ✅ Final Pre-Launch Checklist (After Phase 6)

- [ ] Real PayHere merchant account approved + live mode tested
- [ ] WhatsApp Business templates all approved by Meta
- [ ] Domain purchased and connected to Vercel
- [ ] Email sender domain SPF/DKIM/DMARC set up
- [ ] Supabase production database backed up
- [ ] Privacy Policy & Terms reviewed (consider consulting a lawyer for SL compliance)
- [ ] Real products + photos uploaded by you via admin
- [ ] Delivery zones + time slots configured
- [ ] You've placed at least one real end-to-end order on the live site
- [ ] Analytics + error monitoring active

🚀 **Good luck with the launch!**
