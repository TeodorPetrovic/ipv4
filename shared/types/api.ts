export interface StudentAuthSession {
  studentDbId: number
  studentId: string
  name: string
}

export interface AuthState {
  student: StudentAuthSession | null
  isAdmin: boolean
}

export interface StudentTest {
  id: number
  title: string
  activeAttemptId: number | null
}

export interface AdminTest {
  id: number
  title: string
  description: string | null
  startAt: string | null
  endAt: string | null
  durationMinutes: number
  maxAttempts: number
  isPublished: boolean
  attemptsCount: number
  submissionsCount: number
  isInvalid: boolean
}

export interface AdminStudent {
  id: number
  studentId: string
  name: string
  createdAt: string | null
  attemptsCount: number
}

export interface TestResultRow {
  id: number
  testId: number
  studentName: string
  studentId: string
  testTitle: string
  status: string
  attemptNumber: number
  score: number | null
  totalQuestions: number
  percentage: number | null
  submittedAt: string | null
  startedAt: string | null
  deadlineAt: string | null
  sections: {
    level1: Array<{ binary: string; studentAnswer: string | null; correctAnswer: string | null }>
    level2: Array<{ ip: string; studentAnswer: string | null; correctAnswer: string | null }>
    level3: Array<{ hostIp: string; studentNetwork: string | null; studentBroadcast: string | null; correctNetwork: string | null; correctBroadcast: string | null }>
    level4: Array<{ mask: string; studentAnswer: string | null; correctAnswer: string | null }>
    level5: Array<{ addressCidr: string; studentAnswer: string | null; correctAnswer: string | null }>
    level6: Array<{ ip1: string; ip2: string | null; mask: string | null; studentAnswer: string | null; correctAnswer: string | null }>
    level7: {
      baseNetwork: string
      baseCidr: number
      subnets: Array<{
        name: string
        hosts: number
        studentNetwork: string | null
        studentMask: string | null
        studentBroadcast: string | null
        correctNetwork: string | null
        correctMask: string | null
        correctBroadcast: string | null
      }>
    }
  }
}
