import mqtt from 'mqtt'
import log from 'loglevel'

import { exec as mqttexec, clean as mqttclean, fill as mqttfill } from 'mqtt-pattern'
import {useEventBus} from "@vueuse/core";


export interface RTLPowerLine {
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
  spectrum_stream: "scanner/+id/stream",
}


export default class Socks {
  private config!: MQTTConfig
  private client!: mqtt.MqttClient
  private bus


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

    this.client.on('message', (topic, message) => {
      const stream_topic = mqttexec(mqttPattern.spectrum_stream, topic)
      if (stream_topic) {
        const data = JSON.parse(message.toString())
        console.log(data)
        this.bus.emit({
          ...data,
          timestamp: new Date(data.timestamp)}
        )
      }

    })
  }
}
