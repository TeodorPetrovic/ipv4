import { cidrToSubnetMask, sameNetwork } from './ipv4'

export interface Level6QuestionSeed {
  section: 'level6'
  questionOrder: number
  promptPrimary: string
  promptSecondary: string
  promptTertiary: string
  expectedAnswer1: string
  points: number
}

export function generateLevel6QuestionSeeds(count = 5): Level6QuestionSeed[] {
  const sameSubnetPattern = [true, false, true, false, true]
  const cidrPool = [8, 10, 11, 12, 13, 14, 16, 18, 20, 21, 22, 24, 29, 30]
  const maxUint32 = 0xFFFFFFFF

  const randInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  const randomFrom = <T>(items: T[]) => {
    return items[randInt(0, items.length - 1)] as T
  }

  const randomFirstOctet = () => {
    const first = randInt(1, 223)
    return first === 127 ? 128 : first
  }

  const octetsToInt = (a: number, b: number, c: number, d: number) => {
    return ((((a << 24) >>> 0) | (b << 16) | (c << 8) | d) >>> 0)
  }

  const intToIp = (value: number) => {
    const a = (value >>> 24) & 255
    const b = (value >>> 16) & 255
    const c = (value >>> 8) & 255
    const d = value & 255
    return `${a}.${b}.${c}.${d}`
  }

  const subnetMaskInt = (cidr: number) => {
    if (cidr <= 0) return 0
    if (cidr >= 32) return maxUint32
    return (maxUint32 << (32 - cidr)) >>> 0
  }

  const firstOctet = (ipInt: number) => {
    return (ipInt >>> 24) & 255
  }

  const hasValidFirstOctet = (ipInt: number) => {
    const first = firstOctet(ipInt)
    return first >= 1 && first <= 223 && first !== 127
  }

  const randomIpInt = () => {
    return octetsToInt(
      randomFirstOctet(),
      randInt(0, 255),
      randInt(0, 255),
      randInt(0, 255),
    )
  }

  return Array.from({ length: count }, (_, index) => {
    const shouldBeSameSubnet = sameSubnetPattern[index % sameSubnetPattern.length] ?? true
    let ip1 = ''
    let ip2 = ''
    let mask = ''

    for (let attempt = 0; attempt < 100; attempt += 1) {
      const cidr = randomFrom(cidrPool)
      const maskInt = subnetMaskInt(cidr)
      const maskCandidate = cidrToSubnetMask(cidr)
      const blockSize = 2 ** (32 - cidr)
      const hostMax = blockSize - 1

      const networkA = (randomIpInt() & maskInt) >>> 0

      let networkB = networkA
      if (!shouldBeSameSubnet) {
        const stepUpPossible = networkA <= maxUint32 - blockSize
        const stepDownPossible = networkA >= blockSize

        if (!stepUpPossible && !stepDownPossible) {
          continue
        }

        const goUp = stepUpPossible && (!stepDownPossible || Math.random() < 0.5)
        networkB = goUp ? (networkA + blockSize) >>> 0 : (networkA - blockSize) >>> 0
      }

      let ip1Int = networkA
      let ip2Int = networkB

      if (shouldBeSameSubnet) {
        const variant = randomFrom(['network-broadcast', 'network-host', 'broadcast-host', 'host-host'] as const)

        if (variant === 'network-broadcast') {
          ip1Int = networkA
          ip2Int = (networkA + hostMax) >>> 0
        } else if (variant === 'network-host') {
          ip1Int = networkA
          ip2Int = hostMax > 1 ? (networkA + randInt(1, hostMax - 1)) >>> 0 : networkA
        } else if (variant === 'broadcast-host') {
          ip1Int = (networkA + hostMax) >>> 0
          ip2Int = hostMax > 1 ? (networkA + randInt(1, hostMax - 1)) >>> 0 : ip1Int
        } else {
          if (hostMax > 1) {
            ip1Int = (networkA + randInt(1, hostMax - 1)) >>> 0
            ip2Int = (networkA + randInt(1, hostMax - 1)) >>> 0
            if (ip1Int === ip2Int && hostMax > 2) {
              ip2Int = (ip2Int + 1) >>> 0
            }
          } else {
            ip1Int = networkA
            ip2Int = (networkA + hostMax) >>> 0
          }
        }
      } else {
        const edgeDistanceA = Math.min(3, hostMax)
        const edgeDistanceB = Math.min(3, hostMax)
        // Close values around adjacent subnet boundary.
        ip1Int = (networkA + hostMax - randInt(0, edgeDistanceA)) >>> 0
        ip2Int = (networkB + randInt(0, edgeDistanceB)) >>> 0
      }

      if (!hasValidFirstOctet(ip1Int) || !hasValidFirstOctet(ip2Int)) {
        continue
      }

      const second1 = (ip1Int >>> 16) & 255
      const third1 = (ip1Int >>> 8) & 255
      const second2 = (ip2Int >>> 16) & 255
      const third2 = (ip2Int >>> 8) & 255
      // Encourage cases where not all upper octets are identical.
      if (second1 === second2 && third1 === third2 && cidr <= 24) {
        continue
      }

      const ip1Candidate = intToIp(ip1Int)
      const ip2Candidate = intToIp(ip2Int)
      const same = sameNetwork(ip1Candidate, ip2Candidate, maskCandidate)

      if (same !== shouldBeSameSubnet) {
        continue
      }

      ip1 = ip1Candidate
      ip2 = ip2Candidate
      mask = maskCandidate
      break
    }

    if (!ip1 || !ip2 || !mask) {
      const fallbackMask = cidrToSubnetMask(30)
      ip1 = '132.49.46.88'
      ip2 = shouldBeSameSubnet ? '132.49.46.91' : '132.49.46.92'
      mask = fallbackMask
    }

    return {
      section: 'level6',
      questionOrder: index + 1,
      promptPrimary: ip1,
      promptSecondary: ip2,
      promptTertiary: mask,
      expectedAnswer1: sameNetwork(ip1, ip2, mask) ? '1' : '0',
      points: 1,
    }
  })
}
