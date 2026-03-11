import { getDb } from '../../utils/db'
import { testSessions } from '../../db/schema'
import {
  generateRandomIp, generateRandomCidr, generateRandomSubnetMask,
  ipToBinary, getIpClass, getNetworkAddress, getBroadcastAddress,
  getHostCountFromMask, cidrToSubnetMask, sameNetwork
} from '../../../utils/ipv4'

function generateLevel1Tasks() {
  const ip = generateRandomIp()
  return [{ binary: ipToBinary(ip), decimal: ip }]
}

function generateLevel2Tasks() {
  const tasks = []
  const classes = ['A', 'B', 'C']
  for (let i = 0; i < 5; i++) {
    const classType = classes[Math.floor(Math.random() * classes.length)]
    const ip = generateRandomIp(classType)
    tasks.push({ ip, class: getIpClass(ip) })
  }
  return tasks
}

function generateLevel3Tasks() {
  const tasks = []
  for (let i = 0; i < 5; i++) {
    const ip = generateRandomIp()
    const cidr = generateRandomCidr(16, 28)
    tasks.push({
      hostIp: `${ip}/${cidr}`,
      networkAddr: getNetworkAddress(ip, cidr),
      broadcastAddr: getBroadcastAddress(ip, cidr),
      cidr
    })
  }
  return tasks
}

function generateLevel4Tasks() {
  const tasks = []
  for (let i = 0; i < 5; i++) {
    const cidr = Math.floor(Math.random() * 11) + 20
    const mask = cidrToSubnetMask(cidr)
    tasks.push({ mask, hostCount: getHostCountFromMask(mask) })
  }
  return tasks
}

function generateLevel5Tasks() {
  const tasks = []
  for (let i = 0; i < 5; i++) {
    const ip1 = generateRandomIp()
    const ip2 = generateRandomIp()
    const mask = generateRandomSubnetMask()
    tasks.push({ ip1, ip2, mask, sameNetwork: sameNetwork(ip1, ip2, mask) })
  }
  return tasks
}

function generateLevel6Tasks() {
  const baseCidr = Math.random() < 0.5 ? 23 : 24
  const firstOctet = Math.floor(Math.random() * 32) + 192
  const secondOctet = Math.floor(Math.random() * 256)
  const thirdOctet = baseCidr === 23 ? Math.floor(Math.random() * 128) * 2 : Math.floor(Math.random() * 256)
  const baseIp = `${firstOctet}.${secondOctet}.${thirdOctet}.0`

  const numSubnets = Math.floor(Math.random() * 3) + 3
  const maxHostsPerSubnet = baseCidr === 23 ? 510 : 254
  const hostRequirements = []

  for (let i = 0; i < numSubnets; i++) {
    const maxHosts = Math.floor(maxHostsPerSubnet / numSubnets)
    const hosts = Math.floor(Math.random() * (maxHosts - 10)) + 10
    hostRequirements.push({ name: `Subnet ${i + 1}`, hosts })
  }
  hostRequirements.sort((a, b) => b.hosts - a.hosts)

  let currentNetwork = baseIp
  const correctAnswers = []

  for (const subnet of hostRequirements) {
    const hostBits = Math.ceil(Math.log2(subnet.hosts + 2))
    const subnetCidr = 32 - hostBits
    const subnetMask = cidrToSubnetMask(subnetCidr)
    const networkAddr = currentNetwork
    const broadcastAddr = getBroadcastAddress(networkAddr, subnetCidr)

    correctAnswers.push({
      name: subnet.name,
      hosts: subnet.hosts,
      networkAddr,
      mask: subnetMask,
      broadcastAddr,
      cidr: subnetCidr
    })

    const broadcastOctets = broadcastAddr.split('.').map(Number)
    broadcastOctets[3]++
    for (let i = 3; i >= 0; i--) {
      if (broadcastOctets[i] > 255) {
        broadcastOctets[i] = 0
        if (i > 0) broadcastOctets[i - 1]++
      }
    }
    currentNetwork = broadcastOctets.join('.')
  }

  return { baseNetwork: baseIp, baseCidr, subnets: correctAnswers }
}

export default defineEventHandler(async (event) => {
  const sessionCookie = getCookie(event, 'session')
  if (!sessionCookie) throw createError({ statusCode: 401, message: 'Not authenticated' })

  const session = JSON.parse(sessionCookie)
  const db = getDb()

  const tasks = {
    level1: generateLevel1Tasks(),
    level2: generateLevel2Tasks(),
    level3: generateLevel3Tasks(),
    level4: generateLevel4Tasks(),
    level5: generateLevel5Tasks(),
    level6: generateLevel6Tasks()
  }

  const [inserted] = await db.insert(testSessions).values({
    studentDbId: session.studentDbId,
    studentName: session.name,
    studentId: session.studentId,
    tasksJson: JSON.stringify(tasks),
    createdAt: new Date(),
  }).$returningId()

  return { sessionId: inserted.id, tasks }
})
