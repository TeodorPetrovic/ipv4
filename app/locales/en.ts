import type { TranslationShape } from './sr-Cyrl'

const en: TranslationShape = {
  layout: {
    logout: 'Logout',
    languageSwitcher: 'Change language',
    toggleTheme: 'Toggle theme',
    student: 'Student',
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
    cancel: 'Cancel',
    continue: 'Continue',
    refresh: 'Refresh',
    backToTests: 'Back to test list',
    submitAnswers: 'Submit answers',
  },
  login: {
    studentTitle: 'Student Login',
    studentDescription: 'Enter your student ID to view available tests.',
    studentIdLabel: 'Student ID',
    studentIdPlaceholder: '2024123456',
    adminTitle: 'Admin Login',
    adminDescription: 'Enter your email and password to manage tests, students, and results.',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    errors: {
      studentIdRequired: 'Student ID is required',
      studentLoginFailed: 'Login failed',
      adminLoginFailed: 'Admin login failed',
    },
  },
  tests: {
    searchPlaceholder: 'Search tests',
    empty: 'No tests available.',
    start: 'Start',
    table: {
      test: 'Test',
      action: 'Action',
    },
    confirm: {
      title: 'Start test',
      description: 'Do you want to start this test now?',
    },
    errors: {
      loadFailed: 'Unable to load tests',
      openFailed: 'Unable to open this test',
    },
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
      title: 'Level 1 - Binary to Decimal Conversion',
      description: 'Translate the given network addresses from binary to decimal form:',
      binary: 'Binary',
      decimalAnswer: 'Decimal answer',
    },
    level2: {
      title: 'Level 2 - IPv4 Class',
      description: 'Calculate the classes of the network addresses:',
      ipAddress: 'IP Address',
      class: 'Class',
    },
    level3: {
      title: 'Level 3 - Network and Broadcast Address',
      description: 'For the given addresses, calculate the network address and broadcast address:',
      hostAddress: 'Host address',
      networkAddress: 'Network address',
      broadcastAddress: 'Broadcast address',
      correctNetwork: 'Correct network',
      correctBroadcast: 'Correct broadcast',
    },
    level4: {
      title: 'Level 4 - Network Capacity',
      description: 'Calculate the maximum possible number of computers in networks with the following subnet masks:',
      subnetMask: 'Subnet mask',
      usableHosts: 'Usable hosts',
    },
    level5: {
      title: 'Level 5 - Addresses of computers with public Internet addresses',
      description: 'Calculate which of the following addresses can be used to address computers on the Internet:',
      address: 'Address',
      usableOnInternet: 'Usable on the Internet?',
    },
    level6: {
      title: 'Level 6 - Local and Remote Addresses',
      description: 'Calculate whether the following computers are in the same network:',
      address1: 'Address 1',
      address2: 'Address 2',
      subnetMask: 'Subnet mask',
      sameNetwork: 'Same network?',
    },
    level7: {
      title: 'Level 7 - Subnetting Project',
      description: "For the needs of the organization's network, the range 152.169.21.0/24 has been assigned. Divide the range into smaller networks that would contain the specified number of computers per department. The networks must be the smallest possible size and sorted in the given order.",
      subnet: 'Subnet',
      hosts: 'Hosts',
      networkAddress: 'Network address',
      subnetMask: 'Subnet mask',
      broadcastAddress: 'Broadcast address',
    },
  },
}

export default en
