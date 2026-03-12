import { describe, expect, test } from 'bun:test'

import {
  cidrToSubnetMask,
  getBroadcastAddress,
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

  test('computes network and broadcast correctly', () => {
    expect(getNetworkAddress('192.168.1.42', 24)).toBe('192.168.1.0')
    expect(getBroadcastAddress('192.168.1.42', 24)).toBe('192.168.1.255')
    expect(getNetworkAddress('10.2.77.199', 16)).toBe('10.2.0.0')
    expect(getBroadcastAddress('10.2.77.199', 16)).toBe('10.2.255.255')
  })

  test('computes host counts and same-network relation', () => {
    expect(getHostCountFromMask('255.255.255.0')).toBe(254)
    expect(getHostCountFromMask('255.255.255.252')).toBe(2)

    expect(sameNetwork('192.168.1.10', '192.168.1.200', '255.255.255.0')).toBe(true)
    expect(sameNetwork('192.168.1.10', '192.168.2.10', '255.255.255.0')).toBe(false)
  })
})
