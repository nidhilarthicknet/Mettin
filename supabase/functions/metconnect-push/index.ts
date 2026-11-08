import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const APP_URL = "https://nidhilarthicknet.github.io/Mettin/?openApp=metconnect";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function allowedPushEndpoint(value: string): boolean {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" || u.username || u.password) return false;
    const host = u.hostname.toLowerCase();
    return host === "fcm.googleapis.com" ||
      host === "updates.push.services.mozilla.com" ||
      host.endsWith(".push.services.mozilla.com") ||
      host === "web.push.apple.com" ||
      host.endsWith(".notify.windows.com");
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { type?: string; record_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const suppliedHook = req.headers.get("x-metconnect-hook") || "";
  const { data: config, error: configError } = await admin.rpc("metconnect_get_push_config");
  if (configError || !config?.metconnect_push_hook_secret_v3) {
    console.error("MetConnect push configuration is unavailable", configError?.message);
    return json({ error: "Push service is not configured" }, 503);
  }
  if (!suppliedHook || suppliedHook !== config.metconnect_push_hook_secret_v3) {
    return json({ error: "Unauthorized" }, 401);
  }

  const type = body.type;
  const recordId = body.record_id;
  if (!recordId || !["call", "call_update", "message"].includes(type || "")) {
    return json({ error: "Unsupported notification event" }, 400);
  }
  if (!config.metconnect_vapid_public_v3 || !config.metconnect_vapid_private_v3) {
    return json({ error: "VAPID keys are not configured" }, 503);
  }

  let recipientId = "";
  let senderId = "";
  let senderBunId: string | null = null;
  let recipientBunId: string | null = null;
  let title = "MetConnect";
  let message = "You have a new MetConnect notification.";
  let tag = "metconnect";
  let kind: "call" | "call_update" | "message" = type as "call" | "call_update" | "message";
  let expiresAt: number | null = null;

  if (type === "call" || type === "call_update") {
    const { data: call, error } = await admin
      .from("metconnect_calls")
      .select("id,caller_id,callee_id,caller_bun_id,callee_bun_id,call_mode,status,created_at")
      .eq("id", recordId)
      .maybeSingle();
    if (error) return json({ error: "Could not load call" }, 500);
    if (!call) return json({ ok: true, skipped: "call_missing" });
    if (type === "call" && call.status !== "ringing") {
      return json({ ok: true, skipped: "call_not_ringing" });
    }
    if (type === "call_update" && call.status === "ringing") {
      return json({ ok: true, skipped: "call_still_ringing" });
    }
    recipientId = call.callee_id;
    senderBunId = call.caller_bun_id || null;
    recipientBunId = call.callee_bun_id || null;
    tag = "metconnect-call-" + call.id;
    if (type === "call") {
      const createdAt = new Date(call.created_at).getTime();
      expiresAt = createdAt + 40_000;
      if (!Number.isFinite(createdAt) || Date.now() > expiresAt) {
        return json({ ok: true, skipped: "call_expired" });
      }
      senderId = call.caller_id;
      title = "Incoming MetConnect call";
    } else {
      title = "MetConnect";
      message = "";
    }
  } else {
    const { data: row, error } = await admin
      .from("metconnect_messages")
      .select("id,sender_id,recipient_id,sender_bun_id,recipient_bun_id")
      .eq("id", recordId)
      .maybeSingle();
    if (error) return json({ error: "Could not load message" }, 500);
    if (!row) return json({ ok: true, skipped: "message_missing" });
    recipientId = row.recipient_id;
    senderId = row.sender_id;
    senderBunId = row.sender_bun_id || null;
    recipientBunId = row.recipient_bun_id || null;
    title = "New MetConnect message";
    tag = "metconnect-message-" + row.id;
  }

  if (senderId) {
    let senderName = "A Metxon contact";
    if (senderBunId) {
      const { data: business, error: businessError } = await admin
        .from("metconnect_bun_profiles")
        .select("owner_id,username,business_name")
        .eq("id", senderBunId)
        .maybeSingle();
      if (businessError) console.warn("MetConnect B-UN lookup:", businessError.message);
      if (business?.username) senderName = "@" + business.username;
      if (business?.owner_id && recipientId) {
        const { data: entitlement } = await admin
          .from("metconnect_bun_entitlements")
          .select("tier,expires_at")
          .eq("user_id", recipientId)
          .maybeSingle();
        const antiBunEnabled = entitlement?.tier === "plus" &&
          entitlement?.expires_at && new Date(entitlement.expires_at).getTime() > Date.now();
        if (antiBunEnabled) {
          const { data: blockRows, error: blockError } = await admin
            .from("metconnect_bun_blocks")
            .select("blocker_id")
            .eq("bun_owner_id", business.owner_id);
          if (blockError) console.warn("MetConnect AntiBUN lookup:", blockError.message);
          const count = new Set((blockRows || []).map((x: { blocker_id: string }) => x.blocker_id)).size;
          const foul = count >= 30 ? "Foul UN 1" :
            count >= 20 ? "Foul UN 2" :
            count >= 10 ? "Foul UN 3" :
            count >= 1 ? "Foul UN 4" : "";
          if (foul) title += " · " + foul;
        }
      }
    } else {
      const { data: sender, error: senderError } = await admin
        .from("profiles")
        .select("username")
        .eq("id", senderId)
        .maybeSingle();
      if (senderError) console.warn("MetConnect sender lookup:", senderError.message);
      senderName = sender?.username ? "@" + sender.username : "A Metxon contact";
    }
    message = type === "call"
      ? senderName + " is calling you."
      : "You have a new message from " + senderName + ".";
  }

  if (recipientBunId) {
    const { data: businessTarget, error: targetError } = await admin
      .from("metconnect_bun_profiles")
      .select("username")
      .eq("id", recipientBunId)
      .maybeSingle();
    if (targetError) console.warn("MetConnect B-UN recipient lookup:", targetError.message);
    if (businessTarget?.username && type === "call") {
      message += " Business line: @" + businessTarget.username + ".";
    }
  }

  const { data: subscriptions, error: subscriptionError } = await admin
    .from("metconnect_push_subscriptions")
    .select("user_id,endpoint,subscription")
    .eq("user_id", recipientId);
  if (subscriptionError) return json({ error: "Could not load push subscriptions" }, 500);
  if (!subscriptions?.length) return json({ ok: true, sent: 0, skipped: "no_subscriptions" });

  webpush.setVapidDetails(
    "https://nidhilarthicknet.github.io",
    config.metconnect_vapid_public_v3,
    config.metconnect_vapid_private_v3,
  );

  const payload = {
    title,
    body: message,
    tag,
    kind,
    url: APP_URL,
    expiresAt,
    timestamp: Date.now(),
  };

  let sent = 0;
  let removed = 0;
  const failures: string[] = [];

  for (const row of subscriptions) {
    if (!allowedPushEndpoint(row.endpoint)) {
      failures.push("unsupported_push_endpoint");
      continue;
    }
    try {
      await webpush.sendNotification(
        row.subscription,
        JSON.stringify(payload),
        {
          TTL: type === "call" ? 45 : type === "call_update" ? 30 : 86_400,
          urgency: type === "call" ? "high" : "normal",
        },
      );
      sent++;
    } catch (error) {
      const statusCode = Number((error as { statusCode?: number })?.statusCode || 0);
      if (statusCode === 404 || statusCode === 410) {
        const { error: deleteError } = await admin
          .from("metconnect_push_subscriptions")
          .delete()
          .eq("user_id", recipientId)
          .eq("endpoint", row.endpoint);
        if (!deleteError) removed++;
      } else {
        console.warn("MetConnect push delivery failed:", statusCode || "unknown");
        failures.push(String(statusCode || "delivery_failed"));
      }
    }
  }

  return json({ ok: true, sent, removed, failed: failures.length });
});