import type { TranslationShape } from './sr-Cyrl'

const en: TranslationShape = {
  layout: {
    logout: 'Logout',
    languageSwitcher: 'Change language',
  },
  ipConverter: {
    title: 'IP Converter',
    decimalToBinary: 'Decimal to Binary',
    binaryToDecimal: 'Binary to Decimal',
    invalidValue: 'Invalid value',
  },
  timer: {
    remainingTime: 'Time Remaining',
  },
  common: {
    yes: 'Yes',
    no: 'No',
    backToTests: 'Back to test list',
    submitAnswers: 'Submit answers',
  },
  test: {
    errors: {
      loadFailed: 'Unable to load this attempt.',
      submitTitle: 'Submission error',
      submitFailed: 'Unable to submit this attempt.',
    },
  },
  results: {
    errors: {
      loadFailed: 'Unable to load results',
      unavailable: 'Results are not available.',
    },
    expired: 'Submission deadline has expired',
    submitted: 'Test submitted',
    yourResult: 'Your result',
    correctPoints: 'correct points',
    passed: 'Test passed',
    partial: 'Partially correct',
    failed: 'Test not passed',
    yourAnswer: 'Your answer',
    correctAnswer: 'Correct answer',
    yourNetworkAddress: 'Your network address',
    yourMask: 'Your mask',
    yourBroadcast: 'Your broadcast address',
    correctNetworkAddress: 'Correct network address',
    correctMask: 'Correct mask',
    correctBroadcast: 'Correct broadcast address',
  },
  levels: {
    level1: {
      title: 'Level 1 · Binary to Decimal Conversion',
      description: 'Convert the binary IPv4 address to decimal form.',
      binary: 'Binary',
      decimalAnswer: 'Decimal answer',
    },
    level2: {
      title: 'Level 2 · IPv4 Class',
      description: 'Determine the class of each IPv4 address.',
      ipAddress: 'IP Address',
      class: 'Class',
    },
    level3: {
      title: 'Level 3 · Network and Broadcast Address',
      description: 'Calculate the network and broadcast address for each host/CIDR pair.',
      hostAddress: 'Host address',
      networkAddress: 'Network address',
      broadcastAddress: 'Broadcast address',
      correctNetwork: 'Correct network',
      correctBroadcast: 'Correct broadcast',
    },
    level4: {
      title: 'Level 4 · Network Capacity',
      description: 'Enter the number of usable hosts for each subnet mask.',
      subnetMask: 'Subnet mask',
      usableHosts: 'Usable hosts',
    },
    level5: {
      title: 'Level 5 · Computers with public Internet addresses',
      description: 'Determine if the given host address can be used for public Internet addressing.',
      address: 'Address',
      usableOnInternet: 'Usable on the Internet?',
    },
    level6: {
      title: 'Level 6 · Local and remote addresses',
      description: 'Determine if each pair of addresses belongs to the same network.',
      address1: 'Address 1',
      address2: 'Address 2',
      subnetMask: 'Subnet mask',
      sameNetwork: 'Same network?',
    },
    level7: {
      title: 'Level 7 · Subnetting Project',
      description: 'Divide {{network}}/{{cidr}} into the required subnet sizes.',
      subnet: 'Subnet',
      hosts: 'Hosts',
      networkAddress: 'Network address',
      subnetMask: 'Subnet mask',
      broadcastAddress: 'Broadcast address',
    },
  },
}

export default en
