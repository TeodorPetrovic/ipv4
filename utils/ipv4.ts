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
  const first = parseInt(ip.split('.')[0])
  if (first >= 1 && first <= 126) return 'A'
  if (first >= 128 && first <= 191) return 'B'
  if (first >= 192 && first <= 223) return 'C'
  if (first >= 224 && first <= 239) return 'D'
  if (first >= 240 && first <= 255) return 'E'
  return 'Invalid'
}

export function cidrToSubnetMask(cidr: number): string {
  const mask = []
  for (let i = 0; i < 4; i++) {
    const bits = Math.min(8, Math.max(0, cidr - i * 8))
    mask.push(256 - Math.pow(2, 8 - bits))
  }
  return mask.join('.')
}

export function subnetMaskToCidr(mask: string): number {
  return mask.split('.').map(Number).reduce((cidr, octet) => {
    return cidr + octet.toString(2).split('1').length - 1
  }, 0)
}

export function getNetworkAddress(ip: string, cidr: number): string {
  const ipOctets = ip.split('.').map(Number)
  const maskOctets = cidrToSubnetMask(cidr).split('.').map(Number)
  return ipOctets.map((o, i) => o & maskOctets[i]).join('.')
}

export function getBroadcastAddress(ip: string, cidr: number): string {
  const ipOctets = ip.split('.').map(Number)
  const maskOctets = cidrToSubnetMask(cidr).split('.').map(Number)
  return ipOctets.map((o, i) => (o & maskOctets[i]) | (~maskOctets[i] & 255)).join('.')
}

export function getHostCount(cidr: number): number {
  return Math.pow(2, 32 - cidr) - 2
}

export function getHostCountFromMask(mask: string): number {
  return getHostCount(subnetMaskToCidr(mask))
}

export function sameNetwork(ip1: string, ip2: string, mask: string): boolean {
  const cidr = subnetMaskToCidr(mask)
  return getNetworkAddress(ip1, cidr) === getNetworkAddress(ip2, cidr)
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
  return cidrToSubnetMask(validCidrs[Math.floor(Math.random() * validCidrs.length)])
}
