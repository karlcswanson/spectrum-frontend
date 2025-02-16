import {defineStore} from 'pinia'

export interface SensorInfo {
  id: string,
  name: string,
}

export interface State {
  sensors: Array<SensorInfo> | null
  render_timer: any | null
}

export default defineStore('general', {
  state: (): State => ({
    sensors: null,
    render_timer: null
  })
})
