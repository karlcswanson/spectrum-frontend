<template>
 <div>
   <svg ref="svg" :viewBox="`0 0 ${width} ${height}`"></svg>
 </div>
</template>

<style>
.line {
  fill: none;
  stroke: steelblue;
  stroke-width: 2px;
}


.grid-lines line {
  stroke: gray;
  stroke-opacity: 0.2;
}
</style>

<script lang="ts">
import {computed, defineComponent, onMounted, ref, watch} from "vue";
import * as d3 from 'd3'
import {useElementSize, useEventBus} from "@vueuse/core";
import type {RTLPowerLine} from "@/socks.ts";


export default defineComponent({
    name:'SpectrumPlot',
    setup() {
      const svg = ref<HTMLElement>()
      const { width, height } = useElementSize(svg)
      const margin = { top: 20, right: 30, bottom: 30, left: 40 }
      const chartHeight = computed(() => [height.value - margin.top - margin.bottom, 0])
      const chartWidth = computed(() => [0, width.value - margin.left - margin.right])
      const bus = useEventBus<RTLPowerLine>('spectrum-stream')

      const unsubscribe = bus.on(listener)



      interface ChartDataType {
        frequency: Float64Array
        power: Float64Array
        condition: Array<string>
      }

      let chart_data: {
        [id: string]: ChartDataType
      } = {}


      function createFrequencyArray(start: number, end: number, step: number): Float64Array {
        const len = Math.floor((end - start) / step) + 1
        return new Float64Array(Array.from(
          { length: len },
          (_, i) => start + i * step
        ))
      }


      function listener(event: RTLPowerLine) {

        let {id, hz_lo, step, power } = event;

        if (!(id in chart_data)) {
          chart_data[id] = {
            frequency: new Float64Array(),
            power: new Float64Array(),
            condition: []
          }
          chart_data[id].frequency = createFrequencyArray(470000000, 608000000, 25000)
          chart_data[id].power = new Float64Array(chart_data[id].frequency.length)
        }

        const bin_start_index = (hz_lo - chart_data[id].frequency[0])/step


        chart_data[id].power.set(power, bin_start_index)

        drawChart();
      }



      function cdGen() {
        const plotData = [];

        for (const id in chart_data) {
          if (chart_data.hasOwnProperty(id)) {
            const id_data = []
            for (let i = 0; i < chart_data[id].frequency.length; i++) {
              if (chart_data[id].power[i] !== 0) {
                id_data.push({
                  frequency: chart_data[id].frequency[i],
                  power: chart_data[id].power[i],
                  id: id
                });
              }
            }
            plotData.push(id_data)
          }
        }
        return plotData;
      }


      const drawChart = () => {
        console.log("drawing chart")
        const svgElement = d3.select(svg.value as HTMLElement)
        svgElement.selectAll('*').remove()


        const chartGroup = svgElement
          .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`)

        const xScale = d3.scaleLinear([470000000, 608000000], chartWidth.value)
        const yScale = d3.scaleLinear([-120, -20], chartHeight.value)

        const colors = d3.scaleOrdinal(d3.schemeCategory10)

        const data = cdGen()
        console.log("chart_data: ")
        console.log(data)

        const line = d3
          .line()
          .x((d) => xScale(d.frequency))
          .y((d) => yScale(d.power))

        svgElement
          .selectAll('path')
          .data(data)
          .join('path')
          .attr('class', 'stock-lines')
          .attr('d', line)
          .style('stroke', (d, i) => colors(d[i]))
          .style('stroke-width', .5)
          .style('fill', 'transparent')
          .attr('transform', `translate(${margin.left},${margin.top})`)




        chartGroup
          .append('g')
          .attr('transform', `translate(0,${height.value - margin.top - margin.bottom})`)
          .call(d3.axisBottom(xScale).tickValues(d3.range(470000000, 608000000, 6000000)).tickFormat((d)=> `${d/1000000} MHz`))

        chartGroup.append('g').call(d3.axisLeft(yScale))


        const xGrid = (g) => g
          .attr('class', 'grid-lines')
          .selectAll('line')
          .data(d3.range(470000000, 608000000, 6000000))
          .join('line')
          .attr('x1', d => xScale(d))
          .attr('x2', d => xScale(d))
          .attr('y1', 0)
          .attr('y2', chartHeight.value[0])
        chartGroup
          .append('g').call(xGrid)

      }


      return {
        svg,
        width,
        height,
        chartHeight,
      }
    }
  })
</script>
