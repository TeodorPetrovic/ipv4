import { eq } from 'drizzle-orm'
import { createError } from 'h3'

import { db } from '../../database'
import { testSessions } from '../../database/schema'
import {
  cidrToSubnetMask,
  compareIps,
  generateRandomCidr,
  generateRandomIp,
  generateRandomSubnetMask,
  getBroadcastAddress,
  getHostCountFromMask,
  getIpClass,
  getNetworkAddress,
  ipToBinary,
  sameNetwork,
} from '../ipv4'

export interface StudentSession {
  studentDbId: number
  name: string
  studentId: string
}

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
      cidr,
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
      cidr: subnetCidr,
    })

    const broadcastOctets = broadcastAddr.split('.').map(Number)
    broadcastOctets[3]++

    for (let i = 3; i >= 0; i--) {
      if (broadcastOctets[i] > 255) {
        broadcastOctets[i] = 0
        if (i > 0) {
          broadcastOctets[i - 1]++
        }
      }
    }

    currentNetwork = broadcastOctets.join('.')
  }

  return { baseNetwork: baseIp, baseCidr, subnets: correctAnswers }
}

export async function createTestSession(session: StudentSession) {
  const tasks = {
    level1: generateLevel1Tasks(),
    level2: generateLevel2Tasks(),
    level3: generateLevel3Tasks(),
    level4: generateLevel4Tasks(),
    level5: generateLevel5Tasks(),
    level6: generateLevel6Tasks(),
  }

  const [inserted] = await db
    .insert(testSessions)
    .values({
      studentDbId: session.studentDbId,
      studentName: session.name,
      studentId: session.studentId,
      tasksJson: JSON.stringify(tasks),
      createdAt: new Date(),
    })
    .$returningId()

  return { sessionId: inserted.id, tasks }
}

export async function submitTestAnswers(sessionId: number, answers: any) {
  const rows = await db
    .select()
    .from(testSessions)
    .where(eq(testSessions.id, sessionId))
    .limit(1)

  if (rows.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'Session not found',
    })
  }

  const tasks = JSON.parse(rows[0].tasksJson)
  let score = 0
  let total = 0

  for (let i = 0; i < tasks.level1.length; i++) {
    total++
    if (compareIps(answers.level1?.[i] || '', tasks.level1[i].decimal)) {
      score++
    }
  }

  for (let i = 0; i < tasks.level2.length; i++) {
    total++
    if ((answers.level2?.[i] || '') === tasks.level2[i].class) {
      score++
    }
  }

  for (let i = 0; i < tasks.level3.length; i++) {
    total += 2
    if (compareIps(answers.level3?.[i]?.network || '', tasks.level3[i].networkAddr)) {
      score++
    }
    if (compareIps(answers.level3?.[i]?.broadcast || '', tasks.level3[i].broadcastAddr)) {
      score++
    }
  }

  for (let i = 0; i < tasks.level4.length; i++) {
    total++
    if (parseInt(answers.level4?.[i] || '0') === tasks.level4[i].hostCount) {
      score++
    }
  }

  for (let i = 0; i < tasks.level5.length; i++) {
    total++
    const expected = tasks.level5[i].sameNetwork ? 'Yes' : 'No'
    if ((answers.level5?.[i] || '') === expected) {
      score++
    }
  }

  for (let i = 0; i < tasks.level6.subnets.length; i++) {
    total += 3
    const correct = tasks.level6.subnets[i]
    if (compareIps(answers.level6?.[i]?.network || '', correct.networkAddr)) {
      score++
    }
    if (compareIps(answers.level6?.[i]?.mask || '', correct.mask)) {
      score++
    }
    if (compareIps(answers.level6?.[i]?.broadcast || '', correct.broadcastAddr)) {
      score++
    }
  }

  await db
    .update(testSessions)
    .set({
      answersJson: JSON.stringify(answers),
      score,
      totalQuestions: total,
      submittedAt: new Date(),
    })
    .where(eq(testSessions.id, sessionId))

  return { score, total, percentage: Math.round((score / total) * 100) }
}
