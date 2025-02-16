import {defineStore} from 'pinia'

export interface SensorInfo {
  id: string,
  name: string,
  description: string,
  command: string,
  last_scan: Date | null,
}

export interface State {
  sensors: Array<SensorInfo>
  render_timer: any | null
}

export default defineStore('general', {
  state: (): State => ({
    sensors: [],
    render_timer: null
  })
})
