<script setup lang="ts">
const { data: sessions, refresh } = await useFetch('/api/results')
const selected = ref<any>(null)

const columns = [
  { key: 'student_name', label: 'Student Name' },
  { key: 'student_id', label: 'Student ID' },
  { key: 'score_display', label: 'Score' },
  { key: 'percentage', label: '%' },
  { key: 'submitted_at', label: 'Submitted' }
]

const rows = computed(() => (sessions.value as any[] || []).map((s: any) => ({
  ...s,
  score_display: `${s.score} / ${s.total_questions}`,
  percentageNum: s.total_questions ? Math.round((s.score / s.total_questions) * 100) : 0,
  percentage: s.total_questions ? Math.round((s.score / s.total_questions) * 100) + '%' : '-',
  tasks: JSON.parse(s.tasks_json || '{}')
})))

function badgeColor(row: any): string {
  if (row.percentageNum >= 70) return 'green'
  if (row.percentageNum >= 50) return 'yellow'
  return 'red'
}

function selectRow(row: any) {
  selected.value = selected.value?.id === row.id ? null : row
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Student Results</h1>
        <div class="flex gap-2">
          <UButton variant="outline" to="/admin">Admin</UButton>
          <UButton icon="i-heroicons-arrow-path" variant="outline" @click="refresh">Refresh</UButton>
        </div>
      </div>

      <UCard>
        <UTable :rows="rows" :columns="columns" @select="selectRow">
          <template #percentage-data="{ row }">
            <UBadge :color="badgeColor(row)">
              {{ row.percentage }}
            </UBadge>
          </template>
        </UTable>
      </UCard>

      <UCard v-if="selected" class="mt-6">
        <template #header>
          <h2 class="font-semibold">Tasks for {{ selected.student_name }} ({{ selected.student_id }})</h2>
        </template>
        <div class="space-y-4 text-sm">
          <div>
            <p class="font-semibold text-gray-700 mb-1">Level 1 – Binary→Decimal</p>
            <p class="font-mono text-gray-600">{{ selected.tasks.level1?.[0]?.binary }} → {{ selected.tasks.level1?.[0]?.decimal }}</p>
          </div>
          <div>
            <p class="font-semibold text-gray-700 mb-1">Level 2 – IP Class</p>
            <p class="font-mono text-gray-600" v-for="(t, i) in selected.tasks.level2" :key="i">{{ t.ip }} → {{ t.class }}</p>
          </div>
          <div>
            <p class="font-semibold text-gray-700 mb-1">Level 3 – Network/Broadcast</p>
            <p class="font-mono text-gray-600" v-for="(t, i) in selected.tasks.level3" :key="i">{{ t.hostIp }} → Net: {{ t.networkAddr }}, BC: {{ t.broadcastAddr }}</p>
          </div>
          <div>
            <p class="font-semibold text-gray-700 mb-1">Level 4 – Host Count</p>
            <p class="font-mono text-gray-600" v-for="(t, i) in selected.tasks.level4" :key="i">{{ t.mask }} → {{ t.hostCount }} hosts</p>
          </div>
          <div>
            <p class="font-semibold text-gray-700 mb-1">Level 5 – Same Network</p>
            <p class="font-mono text-gray-600" v-for="(t, i) in selected.tasks.level5" :key="i">{{ t.ip1 }} & {{ t.ip2 }} / {{ t.mask }} → {{ t.sameNetwork ? 'Yes' : 'No' }}</p>
          </div>
          <div>
            <p class="font-semibold text-gray-700 mb-1">Level 6 – VLSM ({{ selected.tasks.level6?.baseNetwork }}/{{ selected.tasks.level6?.baseCidr }})</p>
            <p class="font-mono text-gray-600" v-for="(s, i) in selected.tasks.level6?.subnets" :key="i">{{ s.name }} ({{ s.hosts }} hosts): {{ s.networkAddr }}/{{ s.cidr }}, {{ s.mask }}, BC: {{ s.broadcastAddr }}</p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
