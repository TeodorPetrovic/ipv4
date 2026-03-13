// IPv4 Utility Functions

// Convert decimal to binary (8 bits)
function decimalToBinary(decimal) {
    return decimal.toString(2).padStart(8, '0');
}

// Convert binary to decimal
function binaryToDecimal(binary) {
    return parseInt(binary, 2);
}

// Convert IP address to binary string
function ipToBinary(ip) {
    const octets = ip.split('.');
    return octets.map(octet => decimalToBinary(parseInt(octet))).join('.');
}

// Convert binary IP to decimal
function binaryToIp(binary) {
    const octets = binary.split('.');
    return octets.map(octet => binaryToDecimal(octet)).join('.');
}

// Determine IP class
function getIpClass(ip) {
    const firstOctet = parseInt(ip.split('.')[0]);
    
    if (firstOctet >= 1 && firstOctet <= 126) return 'A';
    if (firstOctet >= 128 && firstOctet <= 191) return 'B';
    if (firstOctet >= 192 && firstOctet <= 223) return 'C';
    if (firstOctet >= 224 && firstOctet <= 239) return 'D';
    if (firstOctet >= 240 && firstOctet <= 255) return 'E';
    
    return 'Invalid';
}

// Convert CIDR to subnet mask
function cidrToSubnetMask(cidr) {
    const mask = [];
    for (let i = 0; i < 4; i++) {
        const bits = Math.min(8, Math.max(0, cidr - i * 8));
        mask.push(256 - (1 << (8 - bits)));
    }
    return mask.join('.');
}

// Convert subnet mask to CIDR
function subnetMaskToCidr(mask) {
    let cidr = 0;
    for (const octet of mask.split('.')) {
        let n = parseInt(octet, 10);
        while (n) {
            cidr += n & 1;
            n >>>= 1;
        }
    }
    return cidr;
}

// Calculate network address
function getNetworkAddress(ip, cidr) {
    const ipOctets = ip.split('.').map(Number);
    const mask = cidrToSubnetMask(cidr);
    const maskOctets = mask.split('.').map(Number);
    
    const networkOctets = ipOctets.map((octet, i) => octet & maskOctets[i]);
    return networkOctets.join('.');
}

// Calculate broadcast address
function getBroadcastAddress(ip, cidr) {
    const ipOctets = ip.split('.').map(Number);
    const mask = cidrToSubnetMask(cidr);
    const maskOctets = mask.split('.').map(Number);
    
    const broadcastOctets = ipOctets.map((octet, i) => 
        (octet & maskOctets[i]) | (~maskOctets[i] & 255)
    );
    return broadcastOctets.join('.');
}

// Calculate number of hosts
function getHostCount(cidr) {
    const hostBits = 32 - cidr;
    return (1 << hostBits) - 2;
}

// Calculate number of hosts from subnet mask
function getHostCountFromMask(mask) {
    const cidr = subnetMaskToCidr(mask);
    return getHostCount(cidr);
}

// Check if IP is private
function isPrivateIp(ip) {
    const octets = ip.split('.').map(Number);
    const firstOctet = octets[0];
    const secondOctet = octets[1];
    
    // 10.0.0.0/8
    if (firstOctet === 10) return true;
    
    // 172.16.0.0/12
    if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) return true;
    
    // 192.168.0.0/16
    if (firstOctet === 192 && secondOctet === 168) return true;
    
    // 127.0.0.0/8 (loopback)
    if (firstOctet === 127) return true;
    
    // 169.254.0.0/16 (link-local)
    if (firstOctet === 169 && secondOctet === 254) return true;
    
    return false;
}

// Check if two IPs are in the same network
function sameNetwork(ip1, ip2, mask) {
    const cidr = subnetMaskToCidr(mask);
    const network1 = getNetworkAddress(ip1, cidr);
    const network2 = getNetworkAddress(ip2, cidr);
    
    return network1 === network2;
}

// Generate random IP
function generateRandomIp(classType = null) {
    let first, second, third, fourth;
    
    if (classType === 'A') {
        first = Math.floor(Math.random() * 126) + 1;
    } else if (classType === 'B') {
        first = Math.floor(Math.random() * 64) + 128;
    } else if (classType === 'C') {
        first = Math.floor(Math.random() * 32) + 192;
    } else {
        first = Math.floor(Math.random() * 223) + 1;
        if (first === 127) first = 128; // Skip loopback
    }
    
    second = Math.floor(Math.random() * 256);
    third = Math.floor(Math.random() * 256);
    fourth = Math.floor(Math.random() * 254) + 1;
    
    return `${first}.${second}.${third}.${fourth}`;
}

// Generate random CIDR
function generateRandomCidr(min = 8, max = 30) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random subnet mask
function generateRandomSubnetMask() {
    const validCidrs = [8, 16, 24, 25, 26, 27, 28, 29, 30];
    const cidr = validCidrs[Math.floor(Math.random() * validCidrs.length)];
    return cidrToSubnetMask(cidr);
}

// Validate IP format
function isValidIp(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    
    for (let part of parts) {
        const num = parseInt(part);
        if (isNaN(num) || num < 0 || num > 255) return false;
    }
    
    return true;
}

// Normalize IP input (trim spaces)
function normalizeIp(ip) {
    return ip.trim().replace(/\s+/g, '');
}

// Compare IPs
function compareIps(ip1, ip2) {
    return normalizeIp(ip1) === normalizeIp(ip2);
}


