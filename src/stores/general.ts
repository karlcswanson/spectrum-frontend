import {defineStore} from 'pinia'

export interface SensorInfo {
  id: string,
  name: string,
}

export interface State {
  sensors: Array<SensorInfo> | null
}

export default defineStore('general', {
  state: (): State => ({
    sensors: null
  })
})
