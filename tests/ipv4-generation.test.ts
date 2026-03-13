import { describe, expect, test } from 'bun:test'

import { generateRandomIp, getIpClass, isValidIp } from '../server/utils/ipv4'

describe('IPv4 generation', () => {
  test('generates valid IPs for each class A-E', () => {
    const classes = ['A', 'B', 'C', 'D', 'E'] as const

    for (const classType of classes) {
      for (let i = 0; i < 200; i += 1) {
        const ip = generateRandomIp(classType)
        expect(isValidIp(ip)).toBe(true)
        expect(getIpClass(ip)).toBe(classType)
      }
    }
  })

  test('default generator avoids loopback first octet 127', () => {
    for (let i = 0; i < 500; i += 1) {
      const ip = generateRandomIp()
      const firstOctet = Number(ip.split('.')[0])
      expect(firstOctet).not.toBe(127)
    }
  })
})
