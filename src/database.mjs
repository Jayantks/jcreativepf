const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class SiteError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function databaseConfig(env) {
  const { SUPABASE_URL: root, SUPABASE_PUBLISHABLE_KEY: publicKey, SUPABASE_SECRET_KEY: secretKey, OWNER_USER_ID: owner } = env;
  if (!root || !publicKey || !secretKey || !uuidPattern.test(owner ?? "")) return null;
  const url = new URL(root);
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/") {
    throw new SiteError("Check the Supabase project URL in deployment settings.", 503);
  }
  return { origin: url.origin, publicKey, secretKey, owner: owner.toLowerCase() };
}

async function supabase(config, path, { token, service, method = "GET", body, prefer } = {}) {
  const headers = new Headers({ apikey: service ? config.secretKey : config.publicKey });
  if (token) headers.set("Authorization", "Bearer " + token);
  else if (headers.get("apikey").startsWith("eyJ")) headers.set("Authorization", "Bearer " + headers.get("apikey"));
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (prefer) headers.set("Prefer", prefer);
  const response = await fetch(config.origin + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(9000) });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const status = response.status;
    if (status === 409) throw new SiteError("That slug is already in use. Choose a different slug.", 409);
    console.warn("Supabase request returned " + status + " for " + path.split("?")[0]);
    throw new SiteError("The data service could not complete this request.", status);
  }
  return data;
}

export async function publicData(config, projectSlug) {
  const [settings, published] = await Promise.all([
    supabase(config, "/rest/v1/portfolio_settings?id=eq.1&select=content"),
    supabase(config, "/rest/v1/rpc/portfolio_published", { method: "POST", body: { requested_slug: projectSlug ?? null } }),
  ]);
  return { settings: settings[0]?.content, published };
}

function cookieValue(request, key) {
  return (request.headers.get("cookie") ?? "").split(";").map(entry => entry.trim()).find(entry => entry.startsWith(key + "="))?.slice(key.length + 1) ?? "";
}

function sessionCookie(request, key, value, seconds) {
  return key + "=" + value + "; Path=/admin; Max-Age=" + seconds + "; HttpOnly; SameSite=Strict" + (new URL(request.url).protocol === "https:" ? "; Secure" : "");
}

function sessionCookies(request, data) {
  return [
    sessionCookie(request, "portfolio_access", data?.access_token ?? "", data ? Math.min(data.expires_in ?? 3600, 3600) : 0),
    sessionCookie(request, "portfolio_refresh", data?.refresh_token ?? "", data ? 604800 : 0),
  ];
}

async function signIn(config, grant, body) {
  try {
    return await supabase(config, "/auth/v1/token?grant_type=" + grant, { method: "POST", body });
  } catch (error) {
    if (error instanceof SiteError && error.status < 500) return null;
    throw error;
  }
}

export async function loginOwner(request, config, email, password) {
  const data = await signIn(config, "password", { email, password });
  if (!data || data.user?.id !== config.owner) return null;
  return { token: data.access_token, cookies: sessionCookies(request, data) };
}

export async function authenticateOwner(request, config) {
  if (!config) return null;
  const accessToken = cookieValue(request, "portfolio_access");
  if (accessToken) {
    try {
      const user = await supabase(config, "/auth/v1/user", { token: accessToken });
      if (user?.id === config.owner) return { token: accessToken, cookies: [] };
      return null;
    } catch (error) {
      if (!(error instanceof SiteError) || error.status >= 500) throw error;
    }
  }
  const refreshToken = cookieValue(request, "portfolio_refresh");
  if (!refreshToken) return null;
  const data = await signIn(config, "refresh_token", { refresh_token: refreshToken });
  if (!data || data.user?.id !== config.owner) return null;
  return { token: data.access_token, cookies: sessionCookies(request, data) };
}

export async function logoutOwner(request, config, session) {
  if (session) {
    try {
      await supabase(config, "/auth/v1/logout?scope=local", { token: session.token, method: "POST" });
    } catch {
      console.warn("Remote session logout did not confirm.");
    }
  }
  return sessionCookies(request, null);
}

export function ownerData(config, token, table, query = "", write = {}) {
  return supabase(config, "/rest/v1/portfolio_" + table + query, { token, ...write });
}

async function abuseKey(config, request, purpose) {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const bytes = new TextEncoder().encode(purpose + "|" + ip);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(config.secretKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, bytes)), value => value.toString(16).padStart(2, "0")).join("");
}

export async function rateAllowed(config, request, purpose) {
  return supabase(config, "/rest/v1/rpc/portfolio_rate_allowed", {
    service: true, method: "POST", body: { bucket: purpose, fingerprint: await abuseKey(config, request, purpose) },
  });
}

export async function saveEnquiry(config, env, enquiry) {
  const rows = await supabase(config, "/rest/v1/portfolio_enquiries?select=id", { service: true, method: "POST", body: enquiry, prefer: "return=representation" });
  const id = rows[0].id;
  let notification = "not_configured";
  if (env.RESEND_API_KEY && env.ENQUIRY_FROM && env.ENQUIRY_TO) {
    notification = "failed";
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json", "Idempotency-Key": "portfolio-enquiry-" + id },
        body: JSON.stringify({
          from: env.ENQUIRY_FROM, to: [env.ENQUIRY_TO], reply_to: enquiry.email,
          subject: "New portfolio enquiry",
          text: [enquiry.name, enquiry.email, enquiry.services.join(", "), enquiry.budget || "Budget unspecified", "", enquiry.message].join("\n"),
        }),
        signal: AbortSignal.timeout(4500),
      });
      if (response.ok) notification = "sent";
      else console.warn("Enquiry email returned status " + response.status + " for " + id);
    } catch {
      console.warn("Enquiry email could not be sent for " + id);
    }
  }
  try {
    await supabase(config, "/rest/v1/portfolio_enquiries?id=eq." + id, { service: true, method: "PATCH", body: { notification } });
  } catch {
    console.warn("Could not save the email status for enquiry " + id);
  }
  return id;
}

export async function uploadAsset(env, file, form) {
  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = env;
  if (!cloud || !key || !secret || !/^[a-z0-9_-]+$/i.test(cloud)) throw new SiteError("Set the Cloudinary credentials before uploading media.");
  if (!(file instanceof File) || !file.size) throw new SiteError("Choose an image or video file to upload.");
  const rules = {
    "image/jpeg": { type: "image", format: "jpg", magic: bytes => bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 },
    "image/png": { type: "image", format: "png", magic: bytes => bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 },
    "image/webp": { type: "image", format: "webp", magic: bytes => String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" },
    "video/mp4": { type: "video", format: "mp4", magic: bytes => String.fromCharCode(...bytes.slice(4, 8)) === "ftyp" },
    "video/webm": { type: "video", format: "webm", magic: bytes => [26, 69, 223, 163].every((byte, index) => bytes[index] === byte) },
  };
  const rule = rules[file.type];
  if (!rule || !rule.magic(new Uint8Array(await file.slice(0, 12).arrayBuffer()))) throw new SiteError("Upload JPEG, PNG, WebP, MP4, or WebM media.");
  if (file.size > (rule.type === "video" ? 20 : 4) * 1024 * 1024) throw new SiteError("Images must be under 4 MB. Videos must be under 20 MB.", 413);
  const alt = String(form.get("alt") ?? "").trim();
  const caption = String(form.get("caption") ?? "").trim();
  if (!alt || alt.length > 220 || caption.length > 350) throw new SiteError("Provide a short description and an optional caption.");
  const data = new FormData();
  const id = "portfolio/" + crypto.randomUUID();
  const params = { allowed_formats: rule.format, overwrite: "false", public_id: id, timestamp: String(Math.floor(Date.now() / 1000)) };
  const signatureInput = Object.entries(params).map(([name, value]) => name + "=" + value).join("&");
  const signature = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(signatureInput + secret));
  data.set("signature", Array.from(new Uint8Array(signature), value => value.toString(16).padStart(2, "0")).join(""));
  data.set("api_key", key);
  data.set("file", file, "portfolio." + rule.format);
  for (const [name, value] of Object.entries(params)) data.set(name, value);
  const response = await fetch("https://api.cloudinary.com/v1_1/" + cloud + "/" + rule.type + "/upload", { method: "POST", body: data, signal: AbortSignal.timeout(25000) });
  const uploaded = await response.json();
  if (!response.ok || uploaded.public_id !== id || uploaded.resource_type !== rule.type) {
    console.warn("Cloudinary upload returned status " + response.status);
    throw new SiteError("The media upload could not be completed.", 502);
  }
  return { cloud, public_id: id, type: rule.type, alt, caption };
}
