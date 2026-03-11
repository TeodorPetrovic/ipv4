<script setup lang="ts">
function decimalToBinary(decimal: number): string {
  return decimal.toString(2).padStart(8, '0')
}
function ipToBinary(ip: string): string {
  return ip.split('.').map(o => decimalToBinary(parseInt(o))).join('.')
}
function binaryToIp(binary: string): string {
  return binary.split('.').map(o => parseInt(o, 2).toString()).join('.')
}
function isValidIp(ip: string): boolean {
  const parts = ip.split('.')
  if (parts.length !== 4) return false
  return parts.every(p => { const n = parseInt(p); return !isNaN(n) && n >= 0 && n <= 255 })
}
function compareIps(a: string, b: string): boolean {
  return a.trim() === b.trim()
}

const decInput = ref('')
const binInput = ref('')
const convResult = ref('')
const convError = ref('')

function convertDecToBin() {
  convError.value = ''
  convResult.value = ''
  if (!isValidIp(decInput.value.trim())) { convError.value = 'Invalid IP format'; return }
  convResult.value = ipToBinary(decInput.value.trim())
}
function convertBinToDec() {
  convError.value = ''
  convResult.value = ''
  const parts = binInput.value.trim().split('.')
  if (parts.length !== 4 || !parts.every(p => /^[01]{8}$/.test(p))) {
    convError.value = 'Use format: xxxxxxxx.xxxxxxxx.xxxxxxxx.xxxxxxxx'
    return
  }
  convResult.value = binaryToIp(binInput.value.trim())
}

const { data: config } = await useFetch('/api/test/config')
const now = ref(new Date())
const gateStatus = computed(() => {
  const cfg = config.value as any
  if (!cfg?.start_date || !cfg?.end_date) return 'open'
  const start = new Date(cfg.start_date)
  const end = new Date(cfg.end_date)
  const dur = cfg.duration_minutes || 60
  if (new Date(start.getTime() + dur * 60000) > end) return 'invalid_config'
  if (now.value < start) return 'not_started'
  if (now.value > end) return 'ended'
  return 'open'
})

const sessionId = ref<number | null>(null)
const tasks = ref<any>(null)
const submitted = ref(false)
const submitting = ref(false)
const gradeResult = ref<any>(null)
const loadError = ref('')
const loading = ref(true)

const answers = reactive({
  level1: [''] as string[],
  level2: ['', '', '', '', ''] as string[],
  level3: Array.from({length: 5}, () => ({ network: '', broadcast: '' })),
  level4: ['', '', '', '', ''] as string[],
  level5: ['', '', '', '', ''] as string[],
  level6: [] as { network: string; mask: string; broadcast: string }[]
})

async function startTest() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await $fetch('/api/test/start', { method: 'POST' }) as any
    sessionId.value = res.sessionId
    tasks.value = res.tasks
    answers.level6 = Array.from({ length: res.tasks.level6.subnets.length }, () => ({ network: '', mask: '', broadcast: '' }))
  } catch (e: any) {
    loadError.value = e.data?.message || 'Failed to load test'
  } finally {
    loading.value = false
  }
}

async function submitAnswers() {
  if (!sessionId.value) return
  submitting.value = true
  try {
    const res = await $fetch('/api/test/submit', {
      method: 'POST',
      body: { sessionId: sessionId.value, answers }
    }) as any
    gradeResult.value = res
    submitted.value = true
  } catch (e: any) {
    loadError.value = e.data?.message || 'Failed to submit'
  } finally {
    submitting.value = false
  }
}

function isCorrect(level: string, idx: number, field?: string): boolean | null {
  if (!submitted.value || !tasks.value) return null
  if (level === 'level1') return compareIps(answers.level1[idx], tasks.value.level1[idx].decimal)
  if (level === 'level2') return answers.level2[idx] === tasks.value.level2[idx].class
  if (level === 'level3') {
    if (field === 'network') return compareIps(answers.level3[idx].network, tasks.value.level3[idx].networkAddr)
    if (field === 'broadcast') return compareIps(answers.level3[idx].broadcast, tasks.value.level3[idx].broadcastAddr)
  }
  if (level === 'level4') return parseInt(answers.level4[idx]) === tasks.value.level4[idx].hostCount
  if (level === 'level5') return answers.level5[idx] === (tasks.value.level5[idx].sameNetwork ? 'Yes' : 'No')
  if (level === 'level6') {
    if (field === 'network') return compareIps(answers.level6[idx].network, tasks.value.level6.subnets[idx].networkAddr)
    if (field === 'mask') return compareIps(answers.level6[idx].mask, tasks.value.level6.subnets[idx].mask)
    if (field === 'broadcast') return compareIps(answers.level6[idx].broadcast, tasks.value.level6.subnets[idx].broadcastAddr)
  }
  return null
}

function fieldClass(correct: boolean | null): string {
  if (correct === null) return 'border-gray-300'
  return correct ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
}

onMounted(() => {
  if (gateStatus.value === 'open') startTest()
  else loading.value = false
})

watch(gateStatus, (val) => {
  if (val === 'open' && !tasks.value && !loading.value) {
    loading.value = true
    startTest()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div v-if="gateStatus !== 'open'" class="min-h-screen flex items-center justify-center p-4">
      <UCard class="max-w-md w-full text-center">
        <div v-if="gateStatus === 'not_started'" class="py-8">
          <p class="text-xl font-semibold text-gray-700">Test Has Not Started Yet</p>
          <p class="text-gray-500 mt-2">Please wait for the test to begin.</p>
        </div>
        <div v-else-if="gateStatus === 'ended'" class="py-8">
          <p class="text-xl font-semibold text-gray-700">Test Has Ended</p>
          <p class="text-gray-500 mt-2">Submissions are no longer accepted.</p>
        </div>
        <div v-else-if="gateStatus === 'invalid_config'" class="py-8">
          <p class="text-xl font-semibold text-red-600">Invalid Test Configuration</p>
          <p class="text-gray-500 mt-2">Test duration exceeds the allowed window. Please contact your administrator.</p>
        </div>
      </UCard>
    </div>

    <div v-else class="flex gap-0">
      <aside class="hidden lg:block w-72 shrink-0">
        <div class="sticky top-4 m-4">
          <UCard>
            <template #header>
              <h3 class="font-semibold text-gray-800">IP Converter</h3>
            </template>
            <div class="space-y-4">
              <div>
                <p class="text-sm font-medium text-gray-700 mb-1">Decimal → Binary</p>
                <div class="flex gap-2">
                  <UInput v-model="decInput" placeholder="192.168.1.1" size="sm" class="flex-1" @keyup.enter="convertDecToBin" />
                  <UButton size="sm" @click="convertDecToBin">Go</UButton>
                </div>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-700 mb-1">Binary → Decimal</p>
                <div class="flex gap-2">
                  <UInput v-model="binInput" placeholder="11000000.10101000.00000001.00000001" size="sm" class="flex-1" @keyup.enter="convertBinToDec" />
                  <UButton size="sm" @click="convertBinToDec">Go</UButton>
                </div>
              </div>
              <div v-if="convResult" class="p-2 bg-green-50 border border-green-200 rounded text-sm font-mono break-all text-green-800">{{ convResult }}</div>
              <div v-if="convError" class="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{{ convError }}</div>
            </div>
          </UCard>
        </div>
      </aside>

      <main class="flex-1 p-4 max-w-4xl">
        <div class="mb-6 bg-slate-800 rounded-lg p-4 text-white text-center">
          <h1 class="text-xl font-semibold">IPv4 Network Exercises</h1>
          <p class="text-slate-300 text-sm mt-1">Computer Science | Network Engineering</p>
        </div>

        <div v-if="loading" class="flex justify-center py-16">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin w-8 h-8 text-gray-500" />
        </div>

        <div v-else-if="loadError" class="py-8">
          <UAlert color="red" :title="loadError" />
        </div>

        <div v-else-if="tasks" class="space-y-6">

          <UCard v-if="submitted && gradeResult" class="border-2" :class="gradeResult.percentage >= 70 ? 'border-green-400' : 'border-orange-400'">
            <div class="text-center py-2">
              <p class="text-3xl font-bold" :class="gradeResult.percentage >= 70 ? 'text-green-600' : 'text-orange-600'">{{ gradeResult.percentage }}%</p>
              <p class="text-gray-600">{{ gradeResult.score }} / {{ gradeResult.total }} correct answers</p>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="font-semibold text-gray-800">Level 1 – Binary to Decimal Conversion</h2>
              <p class="text-sm text-gray-500">Convert the binary network address to decimal format</p>
            </template>
            <table class="w-full text-sm">
              <thead><tr class="bg-gray-50"><th class="text-left p-2 font-medium text-gray-600">Binary</th><th class="text-left p-2 font-medium text-gray-600">Decimal</th></tr></thead>
              <tbody>
                <tr v-for="(task, i) in tasks.level1" :key="i" class="border-t">
                  <td class="p-2 font-mono text-gray-700">{{ task.binary }}</td>
                  <td class="p-2">
                    <input v-model="answers.level1[i]" :disabled="submitted" placeholder="xxx.xxx.xxx.xxx"
                      class="w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
                      :class="fieldClass(isCorrect('level1', i))" />
                    <p v-if="submitted && !isCorrect('level1', i)" class="text-xs text-green-700 mt-1">✓ {{ task.decimal }}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="font-semibold text-gray-800">Level 2 – IPv4 Class Identification</h2>
              <p class="text-sm text-gray-500">Determine the class of each IP address</p>
            </template>
            <table class="w-full text-sm">
              <thead><tr class="bg-gray-50"><th class="text-left p-2 font-medium text-gray-600">IP Address</th><th class="text-left p-2 font-medium text-gray-600">Class</th></tr></thead>
              <tbody>
                <tr v-for="(task, i) in tasks.level2" :key="i" class="border-t">
                  <td class="p-2 font-mono text-gray-700">{{ task.ip }}</td>
                  <td class="p-2">
                    <select v-model="answers.level2[i]" :disabled="submitted"
                      class="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      :class="fieldClass(isCorrect('level2', i))">
                      <option value="">Select class</option>
                      <option v-for="c in ['A','B','C','D','E']" :key="c" :value="c">{{ c }}</option>
                    </select>
                    <p v-if="submitted && !isCorrect('level2', i)" class="text-xs text-green-700 mt-1">✓ Class {{ task.class }}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="font-semibold text-gray-800">Level 3 – Network & Broadcast Address</h2>
              <p class="text-sm text-gray-500">Calculate the network and broadcast addresses</p>
            </template>
            <table class="w-full text-sm">
              <thead><tr class="bg-gray-50">
                <th class="text-left p-2 font-medium text-gray-600">Host Address</th>
                <th class="text-left p-2 font-medium text-gray-600">Network Address</th>
                <th class="text-left p-2 font-medium text-gray-600">Broadcast Address</th>
              </tr></thead>
              <tbody>
                <tr v-for="(task, i) in tasks.level3" :key="i" class="border-t">
                  <td class="p-2 font-mono text-gray-700">{{ task.hostIp }}</td>
                  <td class="p-2">
                    <input v-model="answers.level3[i].network" :disabled="submitted" placeholder="xxx.xxx.xxx.xxx"
                      class="w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
                      :class="fieldClass(isCorrect('level3', i, 'network'))" />
                    <p v-if="submitted && !isCorrect('level3', i, 'network')" class="text-xs text-green-700 mt-1">✓ {{ task.networkAddr }}</p>
                  </td>
                  <td class="p-2">
                    <input v-model="answers.level3[i].broadcast" :disabled="submitted" placeholder="xxx.xxx.xxx.xxx"
                      class="w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
                      :class="fieldClass(isCorrect('level3', i, 'broadcast'))" />
                    <p v-if="submitted && !isCorrect('level3', i, 'broadcast')" class="text-xs text-green-700 mt-1">✓ {{ task.broadcastAddr }}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="font-semibold text-gray-800">Level 4 – Network Capacity</h2>
              <p class="text-sm text-gray-500">Calculate the maximum number of hosts for each subnet mask</p>
            </template>
            <table class="w-full text-sm">
              <thead><tr class="bg-gray-50"><th class="text-left p-2 font-medium text-gray-600">Subnet Mask</th><th class="text-left p-2 font-medium text-gray-600">Number of Hosts</th></tr></thead>
              <tbody>
                <tr v-for="(task, i) in tasks.level4" :key="i" class="border-t">
                  <td class="p-2 font-mono text-gray-700">{{ task.mask }}</td>
                  <td class="p-2">
                    <input v-model="answers.level4[i]" :disabled="submitted" type="text" placeholder="Number of hosts"
                      class="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      :class="fieldClass(isCorrect('level4', i))" />
                    <p v-if="submitted && !isCorrect('level4', i)" class="text-xs text-green-700 mt-1">✓ {{ task.hostCount }}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="font-semibold text-gray-800">Level 5 – Same Network Check</h2>
              <p class="text-sm text-gray-500">Determine if the two addresses are on the same network</p>
            </template>
            <table class="w-full text-sm">
              <thead><tr class="bg-gray-50">
                <th class="text-left p-2 font-medium text-gray-600">Address 1</th>
                <th class="text-left p-2 font-medium text-gray-600">Address 2</th>
                <th class="text-left p-2 font-medium text-gray-600">Subnet Mask</th>
                <th class="text-left p-2 font-medium text-gray-600">Same Network?</th>
              </tr></thead>
              <tbody>
                <tr v-for="(task, i) in tasks.level5" :key="i" class="border-t">
                  <td class="p-2 font-mono text-gray-700">{{ task.ip1 }}</td>
                  <td class="p-2 font-mono text-gray-700">{{ task.ip2 }}</td>
                  <td class="p-2 font-mono text-gray-700">{{ task.mask }}</td>
                  <td class="p-2">
                    <select v-model="answers.level5[i]" :disabled="submitted"
                      class="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      :class="fieldClass(isCorrect('level5', i))">
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    <p v-if="submitted && !isCorrect('level5', i)" class="text-xs text-green-700 mt-1">✓ {{ task.sameNetwork ? 'Yes' : 'No' }}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="font-semibold text-gray-800">Level 6 – VLSM Subnetting</h2>
              <p class="text-sm text-gray-500">Subnet {{ tasks.level6.baseNetwork }}/{{ tasks.level6.baseCidr }} using VLSM to accommodate the following requirements:</p>
            </template>
            <table class="w-full text-sm">
              <thead><tr class="bg-gray-50">
                <th class="text-left p-2 font-medium text-gray-600">Subnet</th>
                <th class="text-left p-2 font-medium text-gray-600">Hosts</th>
                <th class="text-left p-2 font-medium text-gray-600">Network Address</th>
                <th class="text-left p-2 font-medium text-gray-600">Subnet Mask</th>
                <th class="text-left p-2 font-medium text-gray-600">Broadcast Address</th>
              </tr></thead>
              <tbody>
                <tr v-for="(subnet, i) in tasks.level6.subnets" :key="i" class="border-t">
                  <td class="p-2 font-semibold text-gray-700">{{ subnet.name }}</td>
                  <td class="p-2 text-gray-700">{{ subnet.hosts }}</td>
                  <td class="p-2">
                    <input v-model="answers.level6[i].network" :disabled="submitted" placeholder="xxx.xxx.xxx.xxx"
                      class="w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
                      :class="fieldClass(isCorrect('level6', i, 'network'))" />
                    <p v-if="submitted && !isCorrect('level6', i, 'network')" class="text-xs text-green-700 mt-1">✓ {{ subnet.networkAddr }}</p>
                  </td>
                  <td class="p-2">
                    <input v-model="answers.level6[i].mask" :disabled="submitted" placeholder="255.255.255.x"
                      class="w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
                      :class="fieldClass(isCorrect('level6', i, 'mask'))" />
                    <p v-if="submitted && !isCorrect('level6', i, 'mask')" class="text-xs text-green-700 mt-1">✓ {{ subnet.mask }}</p>
                  </td>
                  <td class="p-2">
                    <input v-model="answers.level6[i].broadcast" :disabled="submitted" placeholder="xxx.xxx.xxx.xxx"
                      class="w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
                      :class="fieldClass(isCorrect('level6', i, 'broadcast'))" />
                    <p v-if="submitted && !isCorrect('level6', i, 'broadcast')" class="text-xs text-green-700 mt-1">✓ {{ subnet.broadcastAddr }}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </UCard>

          <div class="flex justify-center pb-8">
            <UButton v-if="!submitted" size="lg" :loading="submitting" @click="submitAnswers">
              Submit Answers
            </UButton>
            <UButton v-else variant="outline" to="/login">
              Done
            </UButton>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
