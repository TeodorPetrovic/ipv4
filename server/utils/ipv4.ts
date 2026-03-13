// Precomputed lookup tables for all 33 valid CIDR prefix lengths (0-32).
// Avoids repeated string/math operations in hot paths.
const _cidrToMaskStr: string[] = Array.from({ length: 33 }, (_, cidr) => {
  const mask = []
  for (let i = 0; i < 4; i++) {
    const bits = Math.min(8, Math.max(0, cidr - i * 8))
    mask.push(256 - (1 << (8 - bits)))
  }
  return mask.join('.')
})

const _cidrToMaskInt: number[] = Array.from({ length: 33 }, (_, cidr) => {
  if (cidr === 0) return 0
  if (cidr >= 32) return 0xFFFFFFFF
  return (0xFFFFFFFF << (32 - cidr)) >>> 0
})

const _maskStrToCidr = new Map<string, number>(
  _cidrToMaskStr.map((mask, cidr) => [mask, cidr]),
)

function _ipToInt(ip: string): number {
  const parts = ip.split('.')
  return (
    ((parseInt(parts[0] ?? '0', 10) << 24) |
    (parseInt(parts[1] ?? '0', 10) << 16) |
    (parseInt(parts[2] ?? '0', 10) << 8) |
    parseInt(parts[3] ?? '0', 10)) >>> 0
  )
}

function _intToIp(n: number): string {
  return `${(n >>> 24) & 255}.${(n >>> 16) & 255}.${(n >>> 8) & 255}.${n & 255}`
}

export function decimalToBinary(decimal: number): string {
  return decimal.toString(2).padStart(8, '0')
}

export function binaryToDecimal(binary: string): number {
  return parseInt(binary, 2)
}

export function ipToBinary(ip: string): string {
  return ip.split('.').map(o => decimalToBinary(parseInt(o))).join('.')
}

export function binaryToIp(binary: string): string {
  return binary.split('.').map(o => binaryToDecimal(o).toString()).join('.')
}

export function getIpClass(ip: string): string {
  const first = parseInt(ip.split('.')[0] ?? '', 10)
  if (first >= 1 && first <= 126) return 'A'
  if (first >= 128 && first <= 191) return 'B'
  if (first >= 192 && first <= 223) return 'C'
  if (first >= 224 && first <= 239) return 'D'
  if (first >= 240 && first <= 255) return 'E'
  return 'Invalid'
}

export function cidrToSubnetMask(cidr: number): string {
  return _cidrToMaskStr[cidr] ?? _cidrToMaskStr[24]!
}

export function subnetMaskToCidr(mask: string): number {
  const cached = _maskStrToCidr.get(mask)
  if (cached !== undefined) return cached
  return mask.split('.').map(Number).reduce((cidr, octet) => {
    return cidr + octet.toString(2).split('1').length - 1
  }, 0)
}

export function getNetworkAddress(ip: string, cidr: number): string {
  const maskInt = _cidrToMaskInt[cidr] ?? 0
  return _intToIp((_ipToInt(ip) & maskInt) >>> 0)
}

export function getBroadcastAddress(ip: string, cidr: number): string {
  const maskInt = _cidrToMaskInt[cidr] ?? 0
  return _intToIp(((_ipToInt(ip) & maskInt) | (~maskInt & 0xFFFFFFFF)) >>> 0)
}

export function getHostCount(cidr: number): number {
  return (1 << (32 - cidr)) - 2
}

export function getHostCountFromMask(mask: string): number {
  return getHostCount(subnetMaskToCidr(mask))
}

export function sameNetwork(ip1: string, ip2: string, mask: string): boolean {
  const cidr = _maskStrToCidr.get(mask) ?? subnetMaskToCidr(mask)
  const maskInt = _cidrToMaskInt[cidr] ?? 0
  const ip1Int = _ipToInt(ip1)
  const ip2Int = _ipToInt(ip2)
  return (ip1Int & maskInt) === (ip2Int & maskInt)
}

export function isValidIp(ip: string): boolean {
  const parts = ip.split('.')
  if (parts.length !== 4) return false
  return parts.every(p => { const n = parseInt(p); return !isNaN(n) && n >= 0 && n <= 255 })
}

export function normalizeIp(ip: string): string {
  return ip.trim().replace(/\s+/g, '')
}

export function compareIps(ip1: string, ip2: string): boolean {
  return normalizeIp(ip1) === normalizeIp(ip2)
}

export function generateRandomIp(classType: string | null = null): string {
  let first: number
  if (classType === 'A') first = Math.floor(Math.random() * 126) + 1
  else if (classType === 'B') first = Math.floor(Math.random() * 64) + 128
  else if (classType === 'C') first = Math.floor(Math.random() * 32) + 192
  else if (classType === 'D') first = Math.floor(Math.random() * 16) + 224
  else if (classType === 'E') first = Math.floor(Math.random() * 16) + 240
  else {
    first = Math.floor(Math.random() * 223) + 1
    if (first === 127) first = 128
  }
  const second = Math.floor(Math.random() * 256)
  const third = Math.floor(Math.random() * 256)
  const fourth = Math.floor(Math.random() * 254) + 1
  return `${first}.${second}.${third}.${fourth}`
}

export function generateRandomCidr(min = 8, max = 30): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateRandomSubnetMask(): string {
  const validCidrs = [8, 16, 24, 25, 26, 27, 28, 29, 30]
  const randomCidr = validCidrs[Math.floor(Math.random() * validCidrs.length)] ?? 24
  return cidrToSubnetMask(randomCidr)
}
