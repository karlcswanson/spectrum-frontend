<script setup lang="ts">
import GeneralStore from '@/stores/general.ts'
import { RouterView } from 'vue-router'
import {inject, onMounted, ref} from "vue";
import {Menubar} from "primevue";
import {useIntervalFn} from "@vueuse/core";

import type Socks from "@/socks.ts";

// import sensors from '@/directory.json'

const generalStore = GeneralStore()
const socks = inject('socks') as Socks

const items = ref([
  {
    label: 'Spectrum',
    icon: 'pi pi-wave-pulse',
  },

])

const { pause, resume, isActive } = useIntervalFn(() => {
  generalStore.render_timer = new Date()
}, 150)


onMounted(() => {
  console.log("connecting to MQTT")
  // if (sensors) {
  //   generalStore.sensors = sensors
  // }
  socks.setup({
    servers: [{ host: 'localhost', port: 8083, protocol: 'ws'}]
  })
  console.log(generalStore.sensors)
})
</script>

<template>
  <div class="card sticky top-0 z-30 m-0.5">
    <Menubar :model="items"/>
  </div>


  <RouterView />
</template>

<style scoped>

</style>
