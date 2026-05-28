"use client";

export function ContactForm() {
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Contact form"
    >
      {[
        { id: "name", label: "Full Name", type: "text", placeholder: "Your name" },
        { id: "email", label: "Email", type: "email", placeholder: "you@example.com" },
        { id: "phone", label: "Phone (optional)", type: "tel", placeholder: "+94 77 ..." },
      ].map((f) => (
        <div key={f.id}>
          <label
            htmlFor={f.id}
            className="block text-sm font-body font-medium text-ink mb-1.5"
          >
            {f.label}
          </label>
          <input
            id={f.id}
            type={f.type}
            placeholder={f.placeholder}
            className="w-full rounded-md border border-input px-3 py-2.5 text-sm font-body text-ink bg-card placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-wine focus:border-transparent transition"
          />
        </div>
      ))}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-body font-medium text-ink mb-1.5"
        >
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          placeholder="How can we help?"
          className="w-full rounded-md border border-input px-3 py-2.5 text-sm font-body text-ink bg-card placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-wine focus:border-transparent transition resize-none"
        />
      </div>
      <button type="submit" className="btn-primary w-full">
        Send Message
      </button>
      <p className="text-xs text-ink-light font-body text-center">
        (Contact form will be wired in Phase 6)
      </p>
    </form>
  );
}
