/*
 * ZIELINSKI & ROZEN — newsletter signup, served by the site's OWN Wix server.
 *
 * SAFE TO APPEND to an existing http-functions.js: all helpers/constants are
 * prefixed NL_ / nl... to avoid collisions. Only requirement — the file's top
 * imports must include these names (merge with your existing import lines):
 *
 *     import { ok, badRequest, serverError } from 'wix-http-functions';
 *     import { contacts } from 'wix-crm-backend';
 *     import wixData from 'wix-data';
 *
 * Then PUBLISH. Endpoint:
 *   POST https://zrp.co.il/_functions/subscribe        (published)
 *   POST https://zrp.co.il/_functions-dev/subscribe    (preview)
 *
 * Per signup: spam guards (honeypot + per-IP rate limit + email validation),
 * then appendOrCreateContact, tags the contact with the "Art Newsletter" label
 * (segment source), and marks it SUBSCRIBED via REST. Runs on Wix.
 *
 * ── REQUIRED to mark contacts SUBSCRIBED ────────────────────────────────────
 *   Create a Wix API key (manage.wix.com/account/api-keys) with the
 *   "Manage Email Subscriptions" permission, then store it in the Wix Secrets
 *   Manager under the name "WIX_API_KEY". Without it the contact is still
 *   created + labelled, just left unsubscribed.
 *
 * ── OPTIONAL: activate the per-IP rate limit ────────────────────────────────
 *   Wix editor → Content Manager → create a collection named exactly
 *   "NewsletterThrottle" with one text field "ip". Until it exists the limiter
 *   fails open (allows everything); everything else still works.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { ok, badRequest, serverError } from 'wix-http-functions';
import { contacts } from 'wix-crm-backend';
import { fetch } from 'wix-fetch';
import { getSecret } from 'wix-secrets-backend';
import wixData from 'wix-data';

const NL_SIGNUP_LABEL = 'Art Newsletter';  // label applied to every signup
const NL_SITE_ID = '03bb4cff-b492-498b-9864-9258e743d0a2';
const NL_RL_COLLECTION = 'NewsletterThrottle';
const NL_RL_WINDOW_MS = 60 * 1000;         // rate-limit window (1 minute)
const NL_RL_MAX = 5;                       // max signups per IP per window

// CORS — '*' is safe here (no cookies/credentials).
const NL_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const NL_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Preflight (browsers send OPTIONS before a JSON POST).
export function options_subscribe() {
  return ok({ headers: NL_CORS });
}

export function post_subscribe(request) {
  const ip = request.ip || '';
  return request.body
    .json()
    .then(async (body) => {
      const email = String((body && body.email) || '').trim().toLowerCase();
      const consent = body && (body.consent === true || body.consent === 'true');
      const honeypot = String((body && body.website) || '').trim();

      // ① Honeypot — real users leave this hidden field empty. Pretend success
      //    so bots don't adapt, but create nothing.
      if (honeypot) {
        return ok({ headers: NL_CORS, body: { ok: true } });
      }

      // ② Validation.
      if (!NL_EMAIL_RE.test(email)) {
        return badRequest({ headers: NL_CORS, body: { ok: false, error: 'invalid_email' } });
      }
      if (!consent) {
        return badRequest({ headers: NL_CORS, body: { ok: false, error: 'consent_required' } });
      }

      // ③ Per-IP rate limit (Wix-side). Fails open if the collection is absent.
      if (await nlIsRateLimited(ip)) {
        return badRequest({ headers: NL_CORS, body: { ok: false, error: 'rate_limited' } });
      }

      // ④ Resolve the segment label, create the contact, then tag it.
      const labelKey = await nlResolveLabelKey();
      const { contactId } = await contacts.appendOrCreateContact({ emails: [{ email }] });
      if (labelKey) {
        try {
          await contacts.labelContact(contactId, [labelKey], { suppressAuth: true });
        } catch (e) {
          console.warn('labelContact failed (contact still created):', e && e.message);
        }
      }

      // ⑤ Mark SUBSCRIBED via REST (Velo can't set subscriptionStatus directly).
      await nlMarkSubscribed(email);

      return ok({ headers: NL_CORS, body: { ok: true, contactId } });
    })
    .catch((err) =>
      serverError({
        headers: NL_CORS,
        body: { ok: false, error: String((err && err.message) || err) },
      })
    );
}

// Returns the "Newsletter" label key, or null if it can't be resolved.
async function nlResolveLabelKey() {
  try {
    const res = await contacts.findOrCreateLabel(NL_SIGNUP_LABEL, { suppressAuth: true });
    return (res && res.label && res.label.key) || null;
  } catch (e) {
    console.warn('findOrCreateLabel failed:', e && e.message);
    return null;
  }
}

// True if this IP exceeded the window. Fails open (false) on any error,
// including the collection not existing yet.
async function nlIsRateLimited(ip) {
  if (!ip) return false;
  try {
    const since = new Date(Date.now() - NL_RL_WINDOW_MS);
    const recent = await wixData
      .query(NL_RL_COLLECTION)
      .eq('ip', ip)
      .ge('_createdDate', since)
      .count({ suppressAuth: true });
    if (recent >= NL_RL_MAX) return true;
    await wixData.insert(NL_RL_COLLECTION, { ip }, { suppressAuth: true });
    return false;
  } catch (e) {
    console.warn('rate-limit skipped (collection missing?):', e && e.message);
    return false;
  }
}

// Sets subscriptionStatus = SUBSCRIBED via the REST Email Subscriptions API.
// Best-effort: if the WIX_API_KEY secret is missing the contact is still
// created (just not marked subscribed) — set the secret to activate this.
async function nlMarkSubscribed(email) {
  try {
    const apiKey = await getSecret('WIX_API_KEY');
    if (!apiKey) {
      console.warn('WIX_API_KEY secret missing — contact not marked SUBSCRIBED');
      return;
    }
    const res = await fetch('https://www.wixapis.com/email-marketing/v1/email-subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
        'wix-site-id': NL_SITE_ID,
      },
      body: JSON.stringify({
        subscription: { email, subscriptionStatus: 'SUBSCRIBED', deliverabilityStatus: 'VALID' },
      }),
    });
    if (!res.ok) {
      console.warn('email-subscriptions upsert failed:', res.status, await res.text());
    }
  } catch (e) {
    console.warn('markSubscribed failed (contact still created):', e && e.message);
  }
}
