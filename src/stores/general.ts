import {defineStore} from 'pinia'

export interface SensorInfo {
  id: string,
  name: string,
  description: string,
  command: string,
  last_scan: Date | null,
}

export interface State {
  sensors: Record<string, SensorInfo>
  render_timer: any | null
  detail_sources: Array<string>
}

export default defineStore('general', {
  state: (): State => ({
    sensors: {},
    render_timer: null,
    detail_sources: [],
  })
})
