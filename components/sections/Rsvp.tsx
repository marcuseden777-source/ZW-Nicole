"use client";

import { useId, useState } from "react";
import { Divider } from "@/components/ui/Ornaments";
import * as content from "@/content/wedding";

type Status = "idle" | "sending" | "sent" | "error";

/** The reply. Shown while the site is living its first life. */
export function Rsvp() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [attending, setAttending] = useState<"yes" | "no" | "">("");
  const nameId = useId();
  const emailId = useId();
  const partyId = useId();
  const noteId = useId();

  if (!content.rsvp.enabled) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      attending: String(form.get("attending") ?? ""),
      partySize: Number(form.get("partySize") ?? 1),
      events: form.getAll("events").map(String),
      note: String(form.get("note") ?? "").trim(),
    };

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error || "We could not record your reply.");
      }

      setStatus("sent");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again in a moment.",
      );
    }
  }

  return (
    <section
      aria-labelledby="rsvp-heading"
      className="relative z-[1] px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
      data-no-print
    >
      <div className="mx-auto max-w-xl text-center">
        <h2 id="rsvp-heading" className="u-reveal u-script text-[clamp(2.5rem,9vw,4rem)] text-gold-deep">
          {content.rsvp.heading}
        </h2>
        <Divider className="mx-auto mt-5" />
        {content.rsvp.note && (
          <p className="u-reveal u-display mt-6 text-sm italic text-ink-faint">
            {content.rsvp.note}
          </p>
        )}

        {status === "sent" ? (
          <p
            role="status"
            className="u-display mt-10 text-balance text-[clamp(1.1rem,3.6vw,1.4rem)] italic leading-relaxed text-ink-soft"
          >
            {attending === "no"
              ? "Thank you for letting us know. You will be missed, and you will be in our duas."
              : "Your reply is with us. We cannot wait to see you there."}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="u-reveal mt-10 space-y-7 text-left">
            <Field label="Your name" htmlFor={nameId}>
              <input
                id={nameId}
                name="name"
                required
                autoComplete="name"
                maxLength={120}
                className={inputClass}
              />
            </Field>

            <Field label="Email" htmlFor={emailId} hint="So we can send you any updates">
              <input
                id={emailId}
                name="email"
                type="email"
                required
                autoComplete="email"
                maxLength={200}
                className={inputClass}
              />
            </Field>

            <fieldset>
              <legend className="u-eyebrow mb-3">Will you join us?</legend>
              <div className="flex gap-3">
                {(
                  [
                    ["yes", "Joyfully accepts"],
                    ["no", "Regretfully declines"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="u-display flex-1 cursor-pointer rounded-full border px-5 py-3.5 text-center text-sm transition-colors duration-300 has-[:checked]:border-gold-ink has-[:checked]:bg-gold-ink has-[:checked]:text-white"
                    style={{ borderColor: "var(--rule)" }}
                  >
                    <input
                      type="radio"
                      name="attending"
                      value={value}
                      required
                      className="sr-only"
                      onChange={() => setAttending(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Only worth asking how many are coming if somebody is. */}
            {attending === "yes" && (
              <>
                <Field
                  label="How many of you, including yourself?"
                  htmlFor={partyId}
                >
                  <select id={partyId} name="partySize" defaultValue="1" className={inputClass}>
                    {Array.from({ length: content.rsvp.maxPartySize }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </Field>

                {content.rsvp.askWhichEvents && content.events.length > 1 && (
                  <fieldset>
                    <legend className="u-eyebrow mb-3">Which celebrations?</legend>
                    <div className="flex flex-wrap gap-2.5">
                      {content.events.map((event) => (
                        <label
                          key={event.name}
                          className="u-display cursor-pointer rounded-full border px-5 py-2.5 text-sm transition-colors duration-300 has-[:checked]:border-gold-ink has-[:checked]:bg-gold-ink has-[:checked]:text-white"
                          style={{ borderColor: "var(--rule)" }}
                        >
                          <input
                            type="checkbox"
                            name="events"
                            value={event.name}
                            defaultChecked
                            className="sr-only"
                          />
                          {event.name}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
              </>
            )}

            <Field
              label="A note for the couple"
              htmlFor={noteId}
              hint="Optional — and it may end up in their keepsake"
            >
              <textarea
                id={noteId}
                name="note"
                rows={3}
                maxLength={1000}
                className={`${inputClass} resize-y`}
              />
            </Field>

            <div className="pt-2 text-center">
              <button
                type="submit"
                disabled={status === "sending"}
                className="u-eyebrow rounded-full border border-gold-ink bg-gold-ink px-10 py-4 text-white transition-opacity duration-300 hover:opacity-85 disabled:cursor-wait disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Send our reply"}
              </button>

              {status === "error" && (
                <p role="alert" className="u-display mt-5 text-sm text-[#a4402f]">
                  {message}
                </p>
              )}

              {content.rsvp.deadlineDisplay && (
                <p className="u-eyebrow mt-6 normal-case tracking-[0.14em]">
                  Kindly reply by {content.rsvp.deadlineDisplay}
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

const inputClass =
  "w-full rounded-none border-0 border-b bg-transparent px-0 py-2.5 font-[family-name:var(--font-display)] text-[1.05rem] text-ink transition-colors duration-300 placeholder:text-ink-faint focus:border-gold focus:outline-none";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderColor: "var(--rule)" }}>
      <label htmlFor={htmlFor} className="u-eyebrow mb-2 block">
        {label}
      </label>
      <div style={{ borderColor: "var(--rule)" }} className="[&>*]:border-b-[color:var(--rule)]">
        {children}
      </div>
      {hint && <p className="u-display mt-1.5 text-xs italic text-ink-faint">{hint}</p>}
    </div>
  );
}
