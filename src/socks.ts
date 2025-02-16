import mqtt from 'mqtt'
import log from 'loglevel'
import GeneralStore from './stores/general'

import { exec as mqttexec, clean as mqttclean, fill as mqttfill } from 'mqtt-pattern'
import {useEventBus} from "@vueuse/core";
import general from "./stores/general";


export interface RTLPowerLine {
  id: string
  timestamp: Date
  hz_lo: number
  hz_hi: number
  step: number
  samples: number
  power: Array<number>
}


interface MQTTConfig {
  servers: Array<{
    host: string
    port: number
    protocol?: 'wss' | 'ws' | 'mqtt' | 'mqtts' | 'tcp' | 'ssl' | 'wx' | 'wxs'
  }>
}

const mqttPattern = {
  status: "scanner/+id/status",
  spectrum_stream: "scanner/+id/stream",
  scan: "scanner/+id/scan",
}


export default class Socks {
  private config!: MQTTConfig
  private client!: mqtt.MqttClient
  private generalStore = GeneralStore()
  private bus

  public scanData: Record<string, RTLPowerLine> = {}

  constructor() {
    log.info('setting up socks')
    this.bus = useEventBus<RTLPowerLine>('spectrum-stream')
  }

  public setup(config: MQTTConfig): void {
    this.config = config
    this.client = mqtt.connect({
      servers: this.config.servers,
      protocolVersion: 5
    })

    this.client.on('connect', () => {
      console.log('connected to mqtt')
      log.info('connected to mqtt')
    })

    this.client.subscribe(mqttclean(mqttPattern.spectrum_stream),
      (e) => {
        console.log(e)
    })

    this.client.subscribe(mqttclean(mqttPattern.status),
      (e) => {
        console.log(e)
    })

    this.client.subscribe(mqttclean(mqttPattern.scan),
      (e) => {
        console.log(e)
    })

    this.client.on('message', (topic, message) => {
      const stream_topic = mqttexec(mqttPattern.spectrum_stream, topic)
      if (stream_topic) {
        const data = JSON.parse(message.toString())
        this.bus.emit({
          ...data,
          timestamp: new Date(data.timestamp)}
        )
      }
      const scan_topic = mqttexec(mqttPattern.scan, topic)
      if (scan_topic) {
        const data = JSON.parse(message.toString())
        this.scanData[data.id] = data
        this.generalStore.sensors[data.id].last_scan = new Date(data.timestamp)
        console.log(this.generalStore.sensors)
        console.log(this.scanData)
      }

      const status_topic = mqttexec(mqttPattern.status, topic)
      if (status_topic) {
        const data = JSON.parse(message.toString())
        this.generalStore.sensors[data.id] = {...this.generalStore.sensors[data.id], ... data}
      }

    })
  }
}
