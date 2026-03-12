export interface AttemptLevel1Row {
  id: number
  binary: string
  studentAnswer: string | null
  correctAnswer: string | null
}

export interface AttemptLevel2Row {
  id: number
  ip: string
  studentAnswer: string | null
  correctAnswer: string | null
}

export interface AttemptLevel3Row {
  id: number
  hostIp: string
  studentNetwork: string | null
  studentBroadcast: string | null
  correctNetwork: string | null
  correctBroadcast: string | null
}

export interface AttemptLevel4Row {
  id: number
  mask: string
  studentAnswer: string | null
  correctAnswer: string | null
}

export interface AttemptLevel5Row {
  id: number
  addressCidr: string
  studentAnswer: string | null
  correctAnswer: string | null
}

export interface AttemptLevel6Row {
  id: number
  ip1: string
  ip2: string | null
  mask: string | null
  studentAnswer: string | null
  correctAnswer: string | null
}

export interface AttemptLevel7SubnetRow {
  id: number
  name: string
  hosts: number
  studentNetwork: string | null
  studentMask: string | null
  studentBroadcast: string | null
  correctNetwork: string | null
  correctMask: string | null
  correctBroadcast: string | null
}

export interface AttemptSections {
  level1: AttemptLevel1Row[]
  level2: AttemptLevel2Row[]
  level3: AttemptLevel3Row[]
  level4: AttemptLevel4Row[]
  level5: AttemptLevel5Row[]
  level6: AttemptLevel6Row[]
  level7: {
    baseNetwork: string
    baseCidr: number
    subnets: AttemptLevel7SubnetRow[]
  }
}

export interface StudentAttemptPayload {
  attempt: {
    id: number
    testId: number
    title: string
    description: string | null
    status: string
    attemptNumber: number
    startedAt: string | null
    deadlineAt: string | null
    submittedAt: string | null
    score: number
    totalQuestions: number
    percentage: number
    canSubmit: boolean
  }
  sections: AttemptSections
}

export interface StudentAttemptResultsPayload {
  attempt: {
    id: number
    testId: number
    title: string
    description: string | null
    status: string
    attemptNumber: number
    startedAt: string | null
    submittedAt: string | null
    score: number
    totalQuestions: number
    percentage: number
  }
  sections: AttemptSections
}

export interface StudentAttemptAnswers {
  level1: string[]
  level2: string[]
  level3: Array<{ network: string; broadcast: string }>
  level4: string[]
  level5: string[]
  level6: string[]
  level7: Array<{ network: string; mask: string; broadcast: string }>
}
