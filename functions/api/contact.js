/**
 * お問い合わせの受け口（Cloudflare Pages Functions）
 *
 * ■ 設計の要点：運営者のメールアドレスをサイト上に一切出さない
 *   ブラウザが話す相手は gin-db.com/api/contact だけ。
 *   送信先（メールアドレスやWebhook URL）は **Cloudflare の環境変数の中にしか存在しない**。
 *   このファイルにも、HTMLにも、JSにも、リポジトリにも書かない。
 *   したがってページのソースを見ても、スクレイピングしても、宛先は分からない。
 *
 * ■ 必要な設定（Cloudflare ダッシュボード → Pages → gin-db → 設定 → 環境変数）
 *   CONTACT_WEBHOOK  … 受信先のURL。Discord/Slackのwebhook、
 *                       Google Apps Script のウェブアプリURL など何でもよい。
 *                       ここにJSONをPOSTする。
 *   （任意）CONTACT_WEBHOOK_FORMAT = "discord" にすると Discord の形に整形する。
 *   （任意）TURNSTILE_SECRET      … Cloudflare Turnstile を使う場合のみ。
 *
 *   環境変数が未設定のうちは、フォームは「受付を準備中」と正直に返す（黙って捨てない）。
 */

const MAX = { name: 100, email: 200, url: 500, message: 4000, kind: 40 };
const KINDS = ["掲載情報の誤り", "新規蒸溜所の掲載依頼", "画像・引用について", "その他"];

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      // このAPIは自サイトのフォームからしか呼ばれない
      "x-robots-tag": "noindex",
    },
  });
}

function clean(v, max) {
  if (typeof v !== "string") return "";
  // 制御文字を落とす。改行(10)とタブ(9)は本文に必要なので残す。
  // ここに制御文字そのものを正規表現で書くと、ファイルに生のバイトが埋まって壊れやすいので
  // コードポイントで判定する。
  let out = "";
  for (const ch of v) {
    const c = ch.codePointAt(0);
    if (c === 9 || c === 10) { out += ch; continue; }
    if (c < 32 || c === 127) continue;
    out += ch;
  }
  return out.trim().slice(0, max);
}

async function verifyTurnstile(secret, token, ip) {
  if (!secret) return true; // 未設定なら検証しない
  if (!token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form });
    const d = await r.json();
    return !!d.success;
  } catch (e) {
    return false;
  }
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json(400, { ok: false, error: "bad_request", message: "送信内容を読み取れませんでした。" });
  }

  // --- スパム対策1: ハニーポット。人には見えない項目に入力があったら弾く
  if (clean(body.website, 50)) {
    // ボットには成功したように見せる（再送を誘発しないため）
    return json(200, { ok: true });
  }

  // --- スパム対策2: フォーム表示から3秒未満の送信は機械とみなす
  const elapsed = Number(body.elapsed);
  if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < 3000) {
    return json(200, { ok: true });
  }

  // --- スパム対策3: Turnstile（設定されている場合のみ）
  const ip = request.headers.get("cf-connecting-ip") || "";
  if (!(await verifyTurnstile(env.TURNSTILE_SECRET, body.token, ip))) {
    return json(400, { ok: false, error: "captcha", message: "確認に失敗しました。時間をおいてお試しください。" });
  }

  const kind = clean(body.kind, MAX.kind);
  const name = clean(body.name, MAX.name);
  const email = clean(body.email, MAX.email);
  const url = clean(body.url, MAX.url);
  const message = clean(body.message, MAX.message);

  if (!message || message.length < 10) {
    return json(422, { ok: false, error: "too_short", message: "お問い合わせ内容を10文字以上でご記入ください。" });
  }
  if (!KINDS.includes(kind)) {
    return json(422, { ok: false, error: "bad_kind", message: "お問い合わせの種類をお選びください。" });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(422, { ok: false, error: "bad_email", message: "メールアドレスの形式をご確認ください。" });
  }

  const hook = env.CONTACT_WEBHOOK;
  if (!hook) {
    // 宛先が未設定。黙って捨てず、送れなかったことを正直に返す。
    return json(503, {
      ok: false, error: "not_configured",
      message: "申し訳ありません。ただいま受付の設定作業中で送信できません。時間をおいてお試しください。",
    });
  }

  const country = request.headers.get("cf-ipcountry") || "";
  const at = new Date().toISOString();
  const lines = [
    `種類: ${kind}`,
    `お名前: ${name || "（未記入）"}`,
    `返信先: ${email || "（未記入・返信不要）"}`,
    `対象ページ: ${url || "（未記入）"}`,
    `国: ${country}`,
    `日時: ${at}`,
    "",
    message,
  ];

  let payload;
  if ((env.CONTACT_WEBHOOK_FORMAT || "").toLowerCase() === "discord") {
    payload = { content: ["**Gin-DB お問い合わせ**", "```", ...lines, "```"].join("\n").slice(0, 1900) };
  } else {
    payload = { site: "Gin-DB", kind, name, email, url, country, at, message, text: lines.join("\n") };
  }

  try {
    const r = await fetch(hook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      return json(502, {
        ok: false, error: "delivery_failed",
        message: "送信に失敗しました。お手数ですが時間をおいてお試しください。",
      });
    }
  } catch (e) {
    // 例外の中身は返さない（宛先URLが漏れうるため）
    return json(502, {
      ok: false, error: "delivery_failed",
      message: "送信に失敗しました。お手数ですが時間をおいてお試しください。",
    });
  }

  return json(200, { ok: true });
}

// onRequestPost だけを export する。
// onRequest を併記すると、そちらが全メソッドを受けて onRequestPost が呼ばれなくなる。
// POST以外は Cloudflare Pages が自動で 405 を返す。
