// 나의 기록 보기 — 이름 + 스파이더 온라인몰 아이디로 개인 기록 파일을 찾아 복호화
// scripts/my-records.mjs 와 같은 계산을 해야 한다 (상수·정규화 규칙을 함께 바꿀 것)
const MY_SALT = 'spyder-combine-my-records-v1';
const MY_ITERATIONS = 150000;

const normName = (s) => String(s ?? '').replace(/\s+/g, '');
const normId = (s) => String(s ?? '').replace(/\s+/g, '').toLowerCase();

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function fetchMyIndex() {
  const res = await fetch('/my/index.json', { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

// 반환: 기록 객체 | null(일치하는 선수 없음)
export async function lookupMyRecord(name, id) {
  const base = await crypto.subtle.importKey('raw', enc.encode(`${normName(name)}\u0000${normId(id)}`), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(MY_SALT), iterations: MY_ITERATIONS, hash: 'SHA-256' },
    base,
    48 * 8,
  );
  const file = hex(bits.slice(0, 16));
  const res = await fetch(`/my/${file}.json`, { cache: 'no-store' });
  // 정적 호스팅은 없는 파일 요청에 index.html을 줄 수 있으므로 JSON인지도 확인
  if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return null;
  const { iv, ct } = await res.json();
  const key = await crypto.subtle.importKey('raw', bits.slice(16, 48), 'AES-GCM', false, ['decrypt']);
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, key, fromB64(ct));
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    return null;
  }
}
