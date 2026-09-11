import { NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════
 *  Where replies go.
 *
 *  Deliberately storage-free: no database to set up, pay for, or lose. A
 *  reply is validated here and forwarded to whatever endpoint is named in
 *  RSVP_WEBHOOK_URL — a Google Sheet, Zapier, Make, n8n, Formspree. If a
 *  Resend key is present it is emailed too.
 *
 *  Nothing is configured? The reply is logged and the guest still gets a
 *  warm confirmation, so a missing environment variable can never make a
 *  guest feel their reply was refused.
 * ═══════════════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
// Replies must never be served from a cache.
export const dynamic = "force-dynamic";

type Rsvp = {
  name: string;
  email: string;
  attending: "yes" | "no";
  partySize: number;
  events: string[];
  note: string;
};

const LIMITS = { name: 120, email: 200, note: 1000, events: 12, party: 20 };

function validate(input: unknown): { data: Rsvp } | { error: string } {
  if (typeof input !== "object" || input === null) {
    return { error: "We could not read that reply." };
  }

  const body = input as Record<string, unknown>;
  const text = (value: unknown, max: number) =>
    typeof value === "string" ? value.trim().slice(0, max) : "";

  const name = text(body.name, LIMITS.name);
  if (!name) return { error: "Please tell us your name." };

  const email = text(body.email, LIMITS.email);
  // Deliberately forgiving: a guest mistyping their address should not be
  // turned away at the door by a regular expression.
  if (!email || !email.includes("@") || !email.includes(".")) {
    return { error: "Please check the email address." };
  }

  const attending = body.attending === "yes" ? "yes" : body.attending === "no" ? "no" : null;
  if (!attending) return { error: "Please let us know whether you can join us." };

  const rawParty = Number(body.partySize);
  const partySize =
    attending === "yes" && Number.isFinite(rawParty)
      ? Math.min(Math.max(Math.round(rawParty), 1), LIMITS.party)
      : attending === "yes"
        ? 1
        : 0;

  const events = Array.isArray(body.events)
    ? body.events
        .filter((e): e is string => typeof e === "string")
        .slice(0, LIMITS.events)
        .map((e) => e.slice(0, 80))
    : [];

  return { data: { name, email, attending, partySize, events, note: text(body.note, LIMITS.note) } };
}

/** Keep guest-written text out of the HTML structure of the notification email. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function forwardToWebhook(rsvp: Rsvp, receivedAt: string) {
  const url = process.env.RSVP_WEBHOOK_URL;
  if (!url) return { attempted: false, ok: false };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rsvp, receivedAt }),
      signal: controller.signal,
    });
    return { attempted: true, ok: response.ok };
  } catch {
    return { attempted: true, ok: false };
  } finally {
    clearTimeout(timeout);
  }
}

async function sendEmail(rsvp: Rsvp, receivedAt: string) {
  const key = process.env.RSVP_RESEND_API_KEY;
  const from = process.env.RSVP_EMAIL_FROM;
  const to = process.env.RSVP_EMAIL_TO;
  if (!key || !from || !to) return { attempted: false, ok: false };

  const rows: [string, string][] = [
    ["Name", rsvp.name],
    ["Email", rsvp.email],
    ["Attending", rsvp.attending === "yes" ? "Yes" : "No"],
    ...(rsvp.attending === "yes"
      ? ([["Party size", String(rsvp.partySize)]] as [string, string][])
      : []),
    ...(rsvp.events.length ? ([["Events", rsvp.events.join(", ")]] as [string, string][]) : []),
    ...(rsvp.note ? ([["Note", rsvp.note]] as [string, string][]) : []),
    ["Received", receivedAt],
  ];

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: rsvp.email,
        subject: `RSVP — ${rsvp.name} ${rsvp.attending === "yes" ? "is coming" : "cannot make it"}`,
        html: `<table style="font-family:Georgia,serif;font-size:15px;line-height:1.6">${rows
          .map(
            ([label, value]) =>
              `<tr><td style="padding:4px 16px 4px 0;color:#8a7a63">${escapeHtml(label)}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`,
          )
          .join("")}</table>`,
      }),
    });
    return { attempted: true, ok: response.ok };
  } catch {
    return { attempted: true, ok: false };
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "We could not read that reply." }, { status: 400 });
  }

  const result = validate(payload);
  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  const receivedAt = new Date().toISOString();
  const [webhook, email] = await Promise.all([
    forwardToWebhook(result.data, receivedAt),
    sendEmail(result.data, receivedAt),
  ]);

  const delivered = webhook.ok || email.ok;
  const configured = webhook.attempted || email.attempted;

  if (!configured) {
    // Nothing is wired up yet. Record it where the developer will see it and
    // still thank the guest — this is the expected state before launch.
    console.info("[rsvp] no delivery target configured; reply was:", {
      ...result.data,
      receivedAt,
    });
    return NextResponse.json({ ok: true, delivered: false });
  }

  if (!delivered) {
    console.error("[rsvp] every delivery target failed for:", {
      ...result.data,
      receivedAt,
    });
    return NextResponse.json(
      {
        ok: false,
        error: "We could not record your reply just now. Please try again shortly.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, delivered: true });
}
