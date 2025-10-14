// Main Application Logic

let currentTasks = {
    level1: [],
    level2: [],
    level3: [],
    level4: [],
    level5: [],
    level6: {}
};

let userAnswers = {
    level1: [],
    level2: [],
    level3: [],
    level4: [],
    level5: [],
    level6: []
};

// Initialize the application
function init() {
    generateAllTasks();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('submit-btn').addEventListener('click', submitAnswers);
    document.getElementById('new-task-btn').addEventListener('click', () => {
        location.reload();
    });
    document.getElementById('print-btn').addEventListener('click', () => {
        window.print();
    });
    
    // Calculator event listeners
    document.getElementById('btn-binary-to-decimal').addEventListener('click', convertBinaryToDecimal);
    document.getElementById('btn-decimal-to-binary').addEventListener('click', convertDecimalToBinary);
    
    // Allow Enter key to trigger conversion
    document.getElementById('calc-binary').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') convertBinaryToDecimal();
    });
    document.getElementById('calc-decimal').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') convertDecimalToBinary();
    });
}

// Generate all tasks
function generateAllTasks() {
    generateLevel1Tasks();
    generateLevel2Tasks();
    generateLevel3Tasks();
    generateLevel4Tasks();
    generateLevel5Tasks();
    generateLevel6Tasks();
}

// Level 1: Binary to Decimal conversion
function generateLevel1Tasks() {
    const tbody = document.getElementById('level1-tbody');
    tbody.innerHTML = '';
    
    for (let i = 0; i < 1; i++) {
        const ip = generateRandomIp();
        const binaryIp = ipToBinary(ip);
        
        currentTasks.level1.push({
            binary: binaryIp,
            decimal: ip
        });
        
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200';
        row.innerHTML = `
            <td class="py-2 px-3 text-gray-700 binary-text">${binaryIp}</td>
            <td class="py-2 px-3"><input type="text" id="level1-${i}" placeholder="xxx.xxx.xxx.xxx" class="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-gray-500" /></td>
        `;
        tbody.appendChild(row);
    }
}

// Level 2: IP Class identification
function generateLevel2Tasks() {
    const tbody = document.getElementById('level2-tbody');
    tbody.innerHTML = '';
    
    const classes = ['A', 'B', 'C'];
    
    for (let i = 0; i < 5; i++) {
        const classType = classes[Math.floor(Math.random() * classes.length)];
        const ip = generateRandomIp(classType);
        
        currentTasks.level2.push({
            ip: ip,
            class: getIpClass(ip)
        });
        
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200';
        row.innerHTML = `
            <td class="py-2 px-3 text-gray-700 font-mono">${ip}</td>
            <td class="py-2 px-3">
                <select id="level2-${i}" class="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-gray-500">
                    <option value="">Select class</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                </select>
            </td>
        `;
        tbody.appendChild(row);
    }
}

// Level 3: Network and Broadcast address
function generateLevel3Tasks() {
    const tbody = document.getElementById('level3-tbody');
    tbody.innerHTML = '';
    
    for (let i = 0; i < 5; i++) {
        const ip = generateRandomIp();
        const cidr = generateRandomCidr(16, 28);
        const networkAddr = getNetworkAddress(ip, cidr);
        const broadcastAddr = getBroadcastAddress(ip, cidr);
        
        currentTasks.level3.push({
            hostIp: `${ip}/${cidr}`,
            networkAddr: networkAddr,
            broadcastAddr: broadcastAddr,
            cidr: cidr
        });
        
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200';
        row.innerHTML = `
            <td class="py-2 px-3 text-gray-700 font-mono">${ip}/${cidr}</td>
            <td class="py-2 px-3"><input type="text" id="level3-network-${i}" placeholder="xxx.xxx.xxx.xxx" class="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-gray-500" /></td>
            <td class="py-2 px-3"><input type="text" id="level3-broadcast-${i}" placeholder="xxx.xxx.xxx.xxx" class="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-gray-500" /></td>
        `;
        tbody.appendChild(row);
    }
}

// Level 4: Network capacity
function generateLevel4Tasks() {
    const tbody = document.getElementById('level4-tbody');
    tbody.innerHTML = '';
    currentTasks.level4 = [];
    
    for (let i = 0; i < 5; i++) {
        // Generate random CIDR from /20 to /30
        const cidr = Math.floor(Math.random() * 11) + 20; // Random between 20 and 30
        const mask = cidrToSubnetMask(cidr);
        const hostCount = getHostCountFromMask(mask);
        
        currentTasks.level4.push({
            mask: mask,
            hostCount: hostCount
        });
        
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200';
        row.innerHTML = `
            <td class="py-2 px-3 text-gray-700 font-mono">${mask}</td>
            <td class="py-2 px-3"><input type="text" id="level4-${i}" placeholder="Number of hosts" class="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-gray-500" /></td>
        `;
        tbody.appendChild(row);
    }
}

// Level 5: Same network check (moved from Level 6)
function generateLevel5Tasks() {
    const tbody = document.getElementById('level5-tbody');
    tbody.innerHTML = '';
    currentTasks.level5 = [];
    
    for (let i = 0; i < 5; i++) {
        const ip1 = generateRandomIp();
        const ip2 = generateRandomIp();
        const mask = generateRandomSubnetMask();
        
        currentTasks.level5.push({
            ip1: ip1,
            ip2: ip2,
            mask: mask,
            sameNetwork: sameNetwork(ip1, ip2, mask)
        });
        
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200';
        row.innerHTML = `
            <td class="py-2 px-3 text-gray-700 font-mono">${ip1}</td>
            <td class="py-2 px-3 text-gray-700 font-mono">${ip2}</td>
            <td class="py-2 px-3 text-gray-700 font-mono">${mask}</td>
            <td class="py-2 px-3">
                <select id="level5-${i}" class="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-gray-500">
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>
            </td>
        `;
        tbody.appendChild(row);
    }
}

// Level 6: Advanced Subnetting (moved from Level 7, modified for /23 or /24)
function generateLevel6Tasks() {
    const tbody = document.getElementById('level6-tbody');
    tbody.innerHTML = '';
    currentTasks.level6 = {};
    
    // Randomly choose /23 or /24
    const baseCidr = Math.random() < 0.5 ? 23 : 24;
    
    // Generate a proper network address (not a random host)
    const firstOctet = Math.floor(Math.random() * 32) + 192; // Class C range
    const secondOctet = Math.floor(Math.random() * 256);
    const thirdOctet = baseCidr === 23 ? Math.floor(Math.random() * 128) * 2 : Math.floor(Math.random() * 256); // Even number for /23
    const baseIp = `${firstOctet}.${secondOctet}.${thirdOctet}.0`;
    
    // Generate 3-5 random subnets
    const numSubnets = Math.floor(Math.random() * 3) + 3; // Random between 3 and 5
    
    // Generate random host requirements for each subnet
    const maxHostsPerSubnet = baseCidr === 23 ? 510 : 254;
    const hostRequirements = [];
    
    for (let i = 0; i < numSubnets; i++) {
        const maxHosts = Math.floor(maxHostsPerSubnet / numSubnets);
        const hosts = Math.floor(Math.random() * (maxHosts - 10)) + 10;
        hostRequirements.push({
            name: `Subnet ${i + 1}`,
            hosts: hosts
        });
    }
    
    // Sort by hosts descending (VLSM)
    hostRequirements.sort((a, b) => b.hosts - a.hosts);
    
    // Calculate subnets starting from the base network address
    let currentNetwork = baseIp;
    const correctAnswers = [];
    
    for (let subnet of hostRequirements) {
        const requiredHosts = subnet.hosts;
        let hostBits = Math.ceil(Math.log2(requiredHosts + 2));
        const subnetCidr = 32 - hostBits;
        const subnetMask = cidrToSubnetMask(subnetCidr);
        
        // Use current network as the network address (already aligned)
        const networkAddr = currentNetwork;
        const broadcastAddr = getBroadcastAddress(networkAddr, subnetCidr);
        
        correctAnswers.push({
            name: subnet.name,
            hosts: subnet.hosts,
            networkAddr: networkAddr,
            mask: subnetMask,
            broadcastAddr: broadcastAddr,
            cidr: subnetCidr
        });
        
        // Calculate next network address (broadcast + 1)
        const broadcastOctets = broadcastAddr.split('.').map(Number);
        broadcastOctets[3]++;
        
        // Handle overflow to next octet
        for (let i = 3; i >= 0; i--) {
            if (broadcastOctets[i] > 255) {
                broadcastOctets[i] = 0;
                if (i > 0) {
                    broadcastOctets[i - 1]++;
                }
            }
        }
        
        currentNetwork = broadcastOctets.join('.');
    }
    
    // Update instruction
    document.getElementById('level6-instruction').textContent = 
        `Subnet the network ${baseIp}/${baseCidr} to accommodate the following requirements (use VLSM):`;
    
    currentTasks.level6 = {
        baseNetwork: baseIp,
        baseCidr: baseCidr,
        subnets: correctAnswers
    };
    
    // Generate table rows
    for (let i = 0; i < hostRequirements.length; i++) {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200';
        row.innerHTML = `
            <td class="py-2 px-3 text-gray-700 font-semibold">${hostRequirements[i].name}</td>
            <td class="py-2 px-3 text-gray-700">${hostRequirements[i].hosts}</td>
            <td class="py-2 px-3"><input type="text" id="level6-network-${i}" placeholder="xxx.xxx.xxx.xxx" class="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-gray-500" /></td>
            <td class="py-2 px-3"><input type="text" id="level6-mask-${i}" placeholder="xxx.xxx.xxx.xxx" class="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-gray-500" /></td>
            <td class="py-2 px-3"><input type="text" id="level6-broadcast-${i}" placeholder="xxx.xxx.xxx.xxx" class="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-gray-500" /></td>
        `;
        tbody.appendChild(row);
    }
}


// Submit and grade answers
function submitAnswers() {
    // Remove all previous feedback rows
    const feedbackRows = document.querySelectorAll('.feedback-row');
    feedbackRows.forEach(row => row.remove());
    
    collectAnswers();
    gradeAnswers();
    displayResults();
}

// Collect user answers
function collectAnswers() {
    // Level 1
    userAnswers.level1 = [];
    for (let i = 0; i < currentTasks.level1.length; i++) {
        const value = document.getElementById(`level1-${i}`).value;
        userAnswers.level1.push(normalizeIp(value));
    }
    
    // Level 2
    userAnswers.level2 = [];
    for (let i = 0; i < currentTasks.level2.length; i++) {
        const value = document.getElementById(`level2-${i}`).value;
        userAnswers.level2.push(value);
    }
    
    // Level 3
    userAnswers.level3 = [];
    for (let i = 0; i < currentTasks.level3.length; i++) {
        userAnswers.level3.push({
            network: normalizeIp(document.getElementById(`level3-network-${i}`).value),
            broadcast: normalizeIp(document.getElementById(`level3-broadcast-${i}`).value)
        });
    }
    
    // Level 4
    userAnswers.level4 = [];
    for (let i = 0; i < currentTasks.level4.length; i++) {
        const value = document.getElementById(`level4-${i}`).value;
        userAnswers.level4.push(value);
    }
    
    // Level 5
    userAnswers.level5 = [];
    for (let i = 0; i < currentTasks.level5.length; i++) {
        const value = document.getElementById(`level5-${i}`).value;
        userAnswers.level5.push(value);
    }
    
    // Level 6
    userAnswers.level6 = [];
    for (let i = 0; i < currentTasks.level6.subnets.length; i++) {
        userAnswers.level6.push({
            network: normalizeIp(document.getElementById(`level6-network-${i}`).value),
            mask: normalizeIp(document.getElementById(`level6-mask-${i}`).value),
            broadcast: normalizeIp(document.getElementById(`level6-broadcast-${i}`).value)
        });
    }
}

// Grade all answers
function gradeAnswers() {
    // Level 1
    for (let i = 0; i < currentTasks.level1.length; i++) {
        const input = document.getElementById(`level1-${i}`);
        const correct = compareIps(userAnswers.level1[i], currentTasks.level1[i].decimal);
        const baseClasses = 'w-full px-2 py-1 border rounded text-gray-900 text-sm focus:outline-none';
        input.className = correct ? `${baseClasses} border-green-500 bg-green-100` : `${baseClasses} border-red-500 bg-red-100`;
        
        if (!correct) {
            addFeedback('level1', i, 
                `Correct answer: <span class="correct-answer">${currentTasks.level1[i].decimal}</span><br>
                 Explanation: A binary address is converted by converting each octet (8 bits) to a decimal number. For example, the first octet has a value of ${currentTasks.level1[i].binary.split('.')[0]} = ${currentTasks.level1[i].decimal.split('.')[0]}.`
            );
        }
    }
    
    // Level 2
    for (let i = 0; i < currentTasks.level2.length; i++) {
        const select = document.getElementById(`level2-${i}`);
        const correct = userAnswers.level2[i] === currentTasks.level2[i].class;
        const baseClasses = 'w-full px-2 py-1 bg-white border rounded text-gray-900 text-sm focus:outline-none';
        select.className = correct ? `${baseClasses} border-green-500 bg-green-100` : `${baseClasses} border-red-500 bg-red-100`;
        
        if (!correct) {
            const firstOctet = parseInt(currentTasks.level2[i].ip.split('.')[0]);
            addFeedback('level2', i,
                `Correct answer: <span class="correct-answer">Class ${currentTasks.level2[i].class}</span><br>
                 Explanation: The first octet is ${firstOctet}. ${getClassExplanation(currentTasks.level2[i].class)}`
            );
        }
    }
    
    // Level 3
    for (let i = 0; i < currentTasks.level3.length; i++) {
        const networkInput = document.getElementById(`level3-network-${i}`);
        const broadcastInput = document.getElementById(`level3-broadcast-${i}`);
        
        const networkCorrect = compareIps(userAnswers.level3[i].network, currentTasks.level3[i].networkAddr);
        const broadcastCorrect = compareIps(userAnswers.level3[i].broadcast, currentTasks.level3[i].broadcastAddr);
        
        const baseClasses = 'w-full px-2 py-1 border rounded text-gray-900 text-sm focus:outline-none';
        networkInput.className = networkCorrect ? `${baseClasses} border-green-500 bg-green-100` : `${baseClasses} border-red-500 bg-red-100`;
        broadcastInput.className = broadcastCorrect ? `${baseClasses} border-green-500 bg-green-100` : `${baseClasses} border-red-500 bg-red-100`;
        
        if (!networkCorrect || !broadcastCorrect) {
            const mask = cidrToSubnetMask(currentTasks.level3[i].cidr);
            addFeedback('level3', i,
                `Correct network address: <span class="correct-answer">${currentTasks.level3[i].networkAddr}</span><br>
                 Correct broadcast address: <span class="correct-answer">${currentTasks.level3[i].broadcastAddr}</span><br>
                 Explanation: For /${currentTasks.level3[i].cidr}, the mask is ${mask}. The network address is obtained by AND operation between the IP address and mask. The broadcast address is the highest address in the network (all host bits set to 1).`
            );
        }
    }
    
    // Level 4
    for (let i = 0; i < currentTasks.level4.length; i++) {
        const input = document.getElementById(`level4-${i}`);
        const correct = parseInt(userAnswers.level4[i]) === currentTasks.level4[i].hostCount;
        const baseClasses = 'w-full px-2 py-1 border rounded text-gray-900 text-sm focus:outline-none';
        input.className = correct ? `${baseClasses} border-green-500 bg-green-100` : `${baseClasses} border-red-500 bg-red-100`;
        
        if (!correct) {
            const cidr = subnetMaskToCidr(currentTasks.level4[i].mask);
            const hostBits = 32 - cidr;
            addFeedback('level4', i,
                `Correct answer: <span class="correct-answer">${currentTasks.level4[i].hostCount}</span><br>
                 Explanation: The mask ${currentTasks.level4[i].mask} (/${cidr}) has ${hostBits} host bits. Number of hosts = 2^${hostBits} - 2 = ${currentTasks.level4[i].hostCount} (we subtract the network address and broadcast address).`
            );
        }
    }
    
    // Level 5
    for (let i = 0; i < currentTasks.level5.length; i++) {
        const select = document.getElementById(`level5-${i}`);
        const expected = currentTasks.level5[i].sameNetwork ? 'Yes' : 'No';
        const correct = userAnswers.level5[i] === expected;
        const baseClasses = 'w-full px-2 py-1 bg-white border rounded text-gray-900 text-sm focus:outline-none';
        select.className = correct ? `${baseClasses} border-green-500 bg-green-100` : `${baseClasses} border-red-500 bg-red-100`;
        
        if (!correct) {
            const cidr = subnetMaskToCidr(currentTasks.level5[i].mask);
            const net1 = getNetworkAddress(currentTasks.level5[i].ip1, cidr);
            const net2 = getNetworkAddress(currentTasks.level5[i].ip2, cidr);
            
            addFeedback('level5', i,
                `Correct answer: <span class="correct-answer">${expected}</span><br>
                 Explanation: The network address for ${currentTasks.level5[i].ip1} is ${net1}, and for ${currentTasks.level5[i].ip2} is ${net2}. ${net1 === net2 ? 'Both addresses are on the same network.' : 'The addresses are on different networks.'}`
            );
        }
    }
    
    // Level 6
    for (let i = 0; i < currentTasks.level6.subnets.length; i++) {
        const networkInput = document.getElementById(`level6-network-${i}`);
        const maskInput = document.getElementById(`level6-mask-${i}`);
        const broadcastInput = document.getElementById(`level6-broadcast-${i}`);
        
        const correctSubnet = currentTasks.level6.subnets[i];
        
        const networkCorrect = compareIps(userAnswers.level6[i].network, correctSubnet.networkAddr);
        const maskCorrect = compareIps(userAnswers.level6[i].mask, correctSubnet.mask);
        const broadcastCorrect = compareIps(userAnswers.level6[i].broadcast, correctSubnet.broadcastAddr);
        
        const baseClasses = 'w-full px-2 py-1 border rounded text-gray-900 text-sm focus:outline-none';
        networkInput.className = networkCorrect ? `${baseClasses} border-green-500 bg-green-100` : `${baseClasses} border-red-500 bg-red-100`;
        maskInput.className = maskCorrect ? `${baseClasses} border-green-500 bg-green-100` : `${baseClasses} border-red-500 bg-red-100`;
        broadcastInput.className = broadcastCorrect ? `${baseClasses} border-green-500 bg-green-100` : `${baseClasses} border-red-500 bg-red-100`;
        
        if (!networkCorrect || !maskCorrect || !broadcastCorrect) {
            const hostBits = 32 - correctSubnet.cidr;
            addFeedback('level6', i,
                `Correct network address: <span class="correct-answer">${correctSubnet.networkAddr}</span><br>
                 Correct subnet mask: <span class="correct-answer">${correctSubnet.mask}</span><br>
                 Correct broadcast address: <span class="correct-answer">${correctSubnet.broadcastAddr}</span><br>
                 Explanation: For ${correctSubnet.hosts} hosts, ${hostBits} host bits are needed (2^${hostBits}-2 = ${Math.pow(2, hostBits) - 2} hosts), which gives a /${correctSubnet.cidr} prefix.`
            );
        }
    }
}

// Add feedback row
function addFeedback(levelId, taskIndex, message) {
    const tbody = document.getElementById(`${levelId}-tbody`);
    const rows = Array.from(tbody.getElementsByTagName('tr'));
    
    // Find the actual task row (not a feedback row)
    let taskRowCount = 0;
    let targetRow = null;
    
    for (let row of rows) {
        if (!row.classList.contains('feedback-row')) {
            if (taskRowCount === taskIndex) {
                targetRow = row;
                break;
            }
            taskRowCount++;
        }
    }
    
    if (!targetRow) return;
    
    const feedbackRow = document.createElement('tr');
    feedbackRow.className = 'feedback-row bg-yellow-50 border-l-4 border-yellow-500';
    
    const colspan = targetRow.getElementsByTagName('td').length;
    feedbackRow.innerHTML = `<td colspan="${colspan}" class="py-2 px-3 text-gray-700 text-sm"><i class="fas fa-exclamation-triangle text-yellow-600 mr-1"></i>${message}</td>`;
    
    // Insert after the target row
    targetRow.parentNode.insertBefore(feedbackRow, targetRow.nextSibling);
}

// Get class explanation
function getClassExplanation(classType) {
    const explanations = {
        'A': 'Class A covers addresses from 1.0.0.0 to 126.255.255.255 (first octet 1-126).',
        'B': 'Class B covers addresses from 128.0.0.0 to 191.255.255.255 (first octet 128-191).',
        'C': 'Class C covers addresses from 192.0.0.0 to 223.255.255.255 (first octet 192-223).',
        'D': 'Class D covers addresses from 224.0.0.0 to 239.255.255.255 (multicast addresses).',
        'E': 'Class E covers addresses from 240.0.0.0 to 255.255.255.255 (reserved for experimental purposes).'
    };
    return explanations[classType] || '';
}

// Get private IP explanation
function getPrivateIpExplanation(ip, isPublic) {
    if (isPublic) {
        return 'This address is public and can be used on the Internet.';
    } else {
        const octets = ip.split('.').map(Number);
        if (octets[0] === 10) {
            return 'This address is private (10.0.0.0/8 range) and cannot be used directly on the Internet.';
        } else if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) {
            return 'This address is private (172.16.0.0/12 range) and cannot be used directly on the Internet.';
        } else if (octets[0] === 192 && octets[1] === 168) {
            return 'This address is private (192.168.0.0/16 range) and cannot be used directly on the Internet.';
        } else if (octets[0] === 127) {
            return 'This address is a loopback address (127.0.0.0/8) and is used for testing the local device.';
        } else if (octets[0] === 169 && octets[1] === 254) {
            return 'This address is a link-local address (169.254.0.0/16) and is used for automatic configuration.';
        }
    }
    return '';
}

// Display results
function displayResults() {
    const resultsSection = document.getElementById('results-section');
    const scoreDisplay = document.getElementById('score-display');
    
    // Calculate score
    let totalQuestions = 0;
    let correctAnswers = 0;
    
    // Count Level 1
    totalQuestions += currentTasks.level1.length;
    for (let i = 0; i < currentTasks.level1.length; i++) {
        if (compareIps(userAnswers.level1[i], currentTasks.level1[i].decimal)) correctAnswers++;
    }
    
    // Count Level 2
    totalQuestions += currentTasks.level2.length;
    for (let i = 0; i < currentTasks.level2.length; i++) {
        if (userAnswers.level2[i] === currentTasks.level2[i].class) correctAnswers++;
    }
    
    // Count Level 3
    totalQuestions += currentTasks.level3.length * 2;
    for (let i = 0; i < currentTasks.level3.length; i++) {
        if (compareIps(userAnswers.level3[i].network, currentTasks.level3[i].networkAddr)) correctAnswers++;
        if (compareIps(userAnswers.level3[i].broadcast, currentTasks.level3[i].broadcastAddr)) correctAnswers++;
    }
    
    // Count Level 4
    totalQuestions += currentTasks.level4.length;
    for (let i = 0; i < currentTasks.level4.length; i++) {
        if (parseInt(userAnswers.level4[i]) === currentTasks.level4[i].hostCount) correctAnswers++;
    }
    
    // Count Level 5
    totalQuestions += currentTasks.level5.length;
    for (let i = 0; i < currentTasks.level5.length; i++) {
        const expected = currentTasks.level5[i].isPublic ? 'Да' : 'Не';
        if (userAnswers.level5[i] === expected) correctAnswers++;
    }
    
    // Count Level 6
    totalQuestions += currentTasks.level6.length;
    for (let i = 0; i < currentTasks.level6.length; i++) {
        const expected = currentTasks.level6[i].sameNetwork ? 'Да' : 'Не';
        if (userAnswers.level6[i] === expected) correctAnswers++;
    }
    
    // Count Level 7
    totalQuestions += currentTasks.level7.subnets.length * 3;
    for (let i = 0; i < currentTasks.level7.subnets.length; i++) {
        const correctSubnet = currentTasks.level7.subnets[i];
        if (compareIps(userAnswers.level7[i].network, correctSubnet.networkAddr)) correctAnswers++;
        if (compareIps(userAnswers.level7[i].mask, correctSubnet.mask)) correctAnswers++;
        if (compareIps(userAnswers.level7[i].broadcast, correctSubnet.broadcastAddr)) correctAnswers++;
    }
    
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    scoreDisplay.innerHTML = `
        <p class="text-gray-700 text-sm">Your score: <span class="font-bold">${correctAnswers} / ${totalQuestions}</span></p>
        <p class="text-2xl font-bold mt-2 text-gray-900">${percentage}%</p>
    `;
    
    if (percentage >= 90) {
        scoreDisplay.className = 'text-center p-4 bg-green-100 rounded mb-4';
        scoreDisplay.innerHTML += '<p class="text-sm mt-2 text-gray-700"><i class="fas fa-trophy text-yellow-600 mr-1"></i>Excellent! Network Expert!</p>';
    } else if (percentage >= 70) {
        scoreDisplay.className = 'text-center p-4 bg-blue-100 rounded mb-4';
        scoreDisplay.innerHTML += '<p class="text-sm mt-2 text-gray-700"><i class="fas fa-thumbs-up text-blue-600 mr-1"></i>Good! Keep Learning!</p>';
    } else {
        scoreDisplay.className = 'text-center p-4 bg-orange-100 rounded mb-4';
        scoreDisplay.innerHTML += '<p class="text-sm mt-2 text-gray-700"><i class="fas fa-book text-orange-600 mr-1"></i>More Practice Needed</p>';
    }
    
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Calculator functions
function convertBinaryToDecimal() {
    const binaryInput = document.getElementById('calc-binary').value.trim();
    const resultDiv = document.getElementById('calc-result');
    const resultText = document.getElementById('calc-result-text');
    
    if (!binaryInput) {
        resultDiv.classList.remove('hidden');
        resultDiv.className = 'mt-4 p-3 bg-red-100 rounded border border-red-300';
        resultText.textContent = 'Please enter a binary IP address';
        return;
    }
    
    try {
        // Validate binary IP format
        const parts = binaryInput.split('.');
        if (parts.length !== 4) {
            throw new Error('Invalid format');
        }
        
        for (let part of parts) {
            if (!/^[01]{8}$/.test(part)) {
                throw new Error('Each octet must be exactly 8 binary digits (0 or 1)');
            }
        }
        
        const decimal = binaryToIp(binaryInput);
        resultDiv.classList.remove('hidden');
        resultDiv.className = 'mt-4 p-3 bg-green-100 rounded border border-green-300';
        resultText.textContent = decimal;
    } catch (error) {
        resultDiv.classList.remove('hidden');
        resultDiv.className = 'mt-4 p-3 bg-red-100 rounded border border-red-300';
        resultText.textContent = error.message || 'Invalid binary IP format. Use format: xxxxxxxx.xxxxxxxx.xxxxxxxx.xxxxxxxx';
    }
}

function convertDecimalToBinary() {
    const decimalInput = document.getElementById('calc-decimal').value.trim();
    const resultDiv = document.getElementById('calc-result');
    const resultText = document.getElementById('calc-result-text');
    
    if (!decimalInput) {
        resultDiv.classList.remove('hidden');
        resultDiv.className = 'mt-4 p-3 bg-red-100 rounded border border-red-300';
        resultText.textContent = 'Please enter a decimal IP address';
        return;
    }
    
    try {
        // Validate decimal IP format
        if (!isValidIp(decimalInput)) {
            throw new Error('Invalid IP format. Use format: xxx.xxx.xxx.xxx (e.g., 192.168.1.1)');
        }
        
        const binary = ipToBinary(decimalInput);
        resultDiv.classList.remove('hidden');
        resultDiv.className = 'mt-4 p-3 bg-green-100 rounded border border-green-300';
        resultText.textContent = binary;
    } catch (error) {
        resultDiv.classList.remove('hidden');
        resultDiv.className = 'mt-4 p-3 bg-red-100 rounded border border-red-300';
        resultText.textContent = error.message || 'Invalid decimal IP format. Use format: xxx.xxx.xxx.xxx';
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

