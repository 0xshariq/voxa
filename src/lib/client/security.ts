// Security utilities for SSRF protection and header filtering
import dns from 'dns/promises';
import net from 'net';

// List of private IP ranges
const privateRanges = [
  ['10.0.0.0', '10.255.255.255'],
  ['172.16.0.0', '172.31.255.255'],
  ['192.168.0.0', '192.168.255.255'],
  ['127.0.0.0', '127.255.255.255'],
  ['::1', '::1'],
  ['fc00::', 'fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'],
  ['fe80::', 'febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff']
];

function ipToLong(ip: string): bigint {
  if (ip.includes(':')) {
    // IPv6
    return BigInt('0x' + ip.split(':').map(x => x.padStart(4, '0')).join(''));
  }
  return ip.split('.').reduce((acc, octet) => (acc << 8n) + BigInt(octet), 0n);
}

function inRange(ip: string, start: string, end: string): boolean {
  try {
    const ipLong = ipToLong(ip);
    return ipLong >= ipToLong(start) && ipLong <= ipToLong(end);
  } catch {
    return false;
  }
}

export async function isPrivateIp(urlStr: string): Promise<boolean> {
  try {
    const url = new URL(urlStr);
    const host = url.hostname;
    if (net.isIP(host)) {
      return privateRanges.some(([start, end]) => inRange(host, start, end));
    }
    const addresses = await dns.lookup(host, { all: true });
    return addresses.some(addr => privateRanges.some(([start, end]) => inRange(addr.address, start, end)));
  } catch {
    return false;
  }
}

export function isValidUrl(urlStr: string): boolean {
  try {
    new URL(urlStr);
    return true;
  } catch {
    return false;
  }
}

// Default safe headers (can be extended)
const SAFE_HEADERS = [
  'accept', 'accept-language', 'content-type', 'content-length', 'user-agent',
  'authorization', 'x-requested-with', 'x-api-key', 'x-xsrf-token'
];

export function filterHeaders(headers: any): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  for (const [k, v] of Object.entries(headers)) {
    if (SAFE_HEADERS.includes(k.toLowerCase())) {
      out[k] = v as string;
    }
  }
  return out;
}