// src/utils/shareCodec.js
//
// Encode and decode a routine payload into a compact URL-friendly string
// so users can share routines without an account or backend.
//
// Format:
//   #/import?d=<base64url(JSON.stringify(payload))>
//
// We strip large fields (gif, instructions, secondary muscles) to keep the
// URL under ~2 kB. Receivers regenerate visuals lazily from the exercise
// service when present.

const STRIP_FIELDS = ['images', 'gif', 'instructions', 'secondary', 'secondaryMuscles', 'secondary_normalized', 'description'];

function stripDeep(obj) {
  if (Array.isArray(obj)) return obj.map(stripDeep);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (STRIP_FIELDS.includes(k)) continue;
      out[k] = stripDeep(v);
    }
    return out;
  }
  return obj;
}

function toBase64Url(str) {
  // utf-8 safe base64url
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeRoutine(name, routine) {
  const lite = stripDeep({ name, routine });
  return toBase64Url(JSON.stringify(lite));
}

export function decodeRoutine(code) {
  if (!code) return null;
  try {
    return JSON.parse(fromBase64Url(code));
  } catch {
    return null;
  }
}

/**
 * Build the full sharable URL for the current page.
 * Hash route format keeps it static-host friendly.
 */
export function buildShareUrl(name, routine) {
  const code = encodeRoutine(name, routine);
  const origin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  return `${origin}#/import?d=${code}`;
}
