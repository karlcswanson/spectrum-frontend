<script setup lang="ts">
import {DataTable} from "primevue";
import {Column} from "primevue";
import SpectrumPlot from "@/components/SpectrumPlot.vue";
import GeneralStore from '@/stores/general.ts'
import Socks, {type RTLPowerLine} from "@/socks.ts";
import { inject } from "vue";
import slugify from "slugify";
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

function handleDragStart(event: DragEvent) {
  if (generalStore.detail_sources.length === 0) {
    console.error("No source selected for export.");
    return;
  }

  const selectedScan = generalStore.detail_sources[0]

  const rtlPowerLine = socks.scanData[selectedScan.id]
  if (!rtlPowerLine) {
    console.error(`No data found for ID: ${selectedScan.id}`)
    return;
  }

  const csvContent = convertToCSV(rtlPowerLine)

  const fileType = "text/csv"
  const dateString = new Date(selectedScan.last_scan).toISOString().replace(/:/g, "-").split(".")[0]
  const fileName = `${slugify(selectedScan.name)}-${dateString}.csv`

  const blob = new Blob([csvContent], {type: fileType})
  const fileUrl = URL.createObjectURL(blob)

  event.dataTransfer?.setData("DownloadURL", `${fileType}:${fileName}:${fileUrl}`);
}




</script>

<template>
  <div>
    <SpectrumPlot draggable="true" @dragstart="handleDragStart" />
    <DataTable :value="Object.values(generalStore.sensors)" selection-mode="multiple" v-model:selection="generalStore.detail_sources">
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
