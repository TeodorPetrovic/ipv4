import { describe, expect, test } from 'bun:test'

import {
  cidrToSubnetMask,
  getBroadcastAddress,
  getHostCount,
  getHostCountFromMask,
  getNetworkAddress,
  sameNetwork,
  subnetMaskToCidr,
} from '../server/utils/ipv4'

describe('IPv4 calculations', () => {
  test('converts CIDR and subnet mask both ways', () => {
    expect(cidrToSubnetMask(24)).toBe('255.255.255.0')
    expect(cidrToSubnetMask(26)).toBe('255.255.255.192')
    expect(subnetMaskToCidr('255.255.255.0')).toBe(24)
    expect(subnetMaskToCidr('255.255.255.192')).toBe(26)
  })

  test('converts boundary CIDR values 0 and 32', () => {
    expect(cidrToSubnetMask(0)).toBe('0.0.0.0')
    expect(cidrToSubnetMask(32)).toBe('255.255.255.255')
    expect(subnetMaskToCidr('0.0.0.0')).toBe(0)
    expect(subnetMaskToCidr('255.255.255.255')).toBe(32)
  })

  test('converts all CIDR values round-trip', () => {
    for (let cidr = 0; cidr <= 32; cidr++) {
      const mask = cidrToSubnetMask(cidr)
      expect(subnetMaskToCidr(mask)).toBe(cidr)
    }
  })

  test('computes network and broadcast correctly', () => {
    expect(getNetworkAddress('192.168.1.42', 24)).toBe('192.168.1.0')
    expect(getBroadcastAddress('192.168.1.42', 24)).toBe('192.168.1.255')
    expect(getNetworkAddress('10.2.77.199', 16)).toBe('10.2.0.0')
    expect(getBroadcastAddress('10.2.77.199', 16)).toBe('10.2.255.255')
  })

  test('computes network and broadcast for /30 and /8', () => {
    expect(getNetworkAddress('172.16.50.130', 30)).toBe('172.16.50.128')
    expect(getBroadcastAddress('172.16.50.130', 30)).toBe('172.16.50.131')
    expect(getNetworkAddress('10.200.100.50', 8)).toBe('10.0.0.0')
    expect(getBroadcastAddress('10.200.100.50', 8)).toBe('10.255.255.255')
  })

  test('computes host counts and same-network relation', () => {
    expect(getHostCountFromMask('255.255.255.0')).toBe(254)
    expect(getHostCountFromMask('255.255.255.252')).toBe(2)

    expect(sameNetwork('192.168.1.10', '192.168.1.200', '255.255.255.0')).toBe(true)
    expect(sameNetwork('192.168.1.10', '192.168.2.10', '255.255.255.0')).toBe(false)
  })

  test('getHostCount matches expected values for common CIDRs', () => {
    expect(getHostCount(30)).toBe(2)
    expect(getHostCount(29)).toBe(6)
    expect(getHostCount(24)).toBe(254)
    expect(getHostCount(16)).toBe(65534)
    expect(getHostCount(8)).toBe(16777214)
  })
})
