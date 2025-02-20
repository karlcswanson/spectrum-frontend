<script setup lang="ts">
import {DataTable} from "primevue";
import {Column} from "primevue";
import SpectrumPlot from "@/components/SpectrumPlot.vue";
import GeneralStore from '@/stores/general.ts'
import Socks, {type RTLPowerLine} from "@/socks.ts";
import {inject} from "vue";
const generalStore = GeneralStore()

const socks = inject('socks') as Socks






function convertToCSV(rtlPowerLine: RTLPowerLine): string {
  const rows: string[] = [];
  let currentHz = rtlPowerLine.hz_lo;

  rtlPowerLine.power.forEach((p) => {
    rows.push(`${currentHz / 1000000},${p}`);
    currentHz += rtlPowerLine.step;
  });

  return rows.join('\n');
}

function downloadScan(id: string) {
  let csvContent = "data:text/csv;charset=utf-8," + convertToCSV(socks.scanData[id]);
  console.log(csvContent)

  var encodedUri = encodeURI(csvContent);
  window.open(encodedUri);

}


</script>

<template>
  <div>
    <SpectrumPlot/>
    <DataTable :value="Object.values(generalStore.sensors)" selection-mode="multiple" v-model:selection="generalStore.detail_sources" >
      <Column field="status" header="Status">
        <template #body="slotProps">
          <span
            class="pi pi-circle-fill"
            :style="{ 'color': slotProps.data.status === 'online' ? 'green' : 'red'}"
          ></span>
          {{ slotProps.data.status }}
        </template>

      </Column>
      <Column field="name" header="Name"></Column>
      <Column field="description" header="Description"></Column>
      <Column field="last_scan" header="Last Scan">
        <template #body="slotProps">
          {{ slotProps.data.last_scan }}
          <span
            v-if="slotProps.data.last_scan"
            class="pi pi-download"@click="downloadScan(slotProps.data.id)"></span>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
