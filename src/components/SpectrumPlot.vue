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

      function listener(event: RTLPowerLine) {
        let { hz_lo, step, power } = event;
        hz_lo = hz_lo / 1e6; // Convert to MHz
        step = step / 1e6;   // Convert to MHz

        const frequencies = Array.from(
          { length: power.length },
          (_, i) => hz_lo + step * i
        );

        const newScan = {
          scan_data: power.map((p, i) => ({
            frequency: frequencies[i],
            power: p,
          })),
        };

        chartData.last_scan_history.push(newScan);

        // If the history exceeds 10 scans, remove the oldest one
        if (chartData.last_scan_history.length > 137) {
          chartData.last_scan_history.shift(); // Remove the oldest scan
        }

        drawChart2();
      }


        let chartData: {
        average: { frequency: number; power: number }[];
        peak: { frequency: number; power: number }[];
        last_scan_history: { scan_data: { frequency: number; power: number }[] }[]; // Store multiple scans
      } = {
        average: [],
        peak: [],
        last_scan_history: [], // Initialize empty history
      };


      function gridLines() {
        const start_freq = 470
        const end_freq = 608
        const uhf_list = []
        for (let i = start_freq; i <= end_freq; i += 6) {
          uhf_list.push(i)
        }
        return uhf_list
      }


      const drawChart2 = () => {
        const svgElement = d3.select(svg.value);
        svgElement.selectAll('*').remove(); // Clear what exists before re-drawing

        const chartGroup = svgElement
          .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);

        const xScale = d3
          .scaleLinear([470, 608], chartWidth.value);
        const yScale = d3
          .scaleLinear([-120, -20], chartHeight.value);

        const line = d3
          .line()
          .x((d) => xScale(d[0]))
          .y((d) => yScale(d[1]));

        // Render history slices in order (oldest to newest)
        chartData.last_scan_history.forEach((slice, index) => {
          const sliceData = slice.scan_data.map(({ frequency, power }) => [
            frequency,
            power,
          ]);



          chartGroup
            .append('path')
            .datum(sliceData)
            .attr('class', 'line')
            .attr('d', line)
            // Apply styles based on position in history
            .style('stroke', index === chartData.last_scan_history.length - 1 ? 'green' : 'darkgreen') // Bright green for newest, dark for the rest
            .style('stroke-width', index === chartData.last_scan_history.length - 1 ? 1 : 0.5) // Thicker stroke for newest scan
            .style('opacity', index === chartData.last_scan_history.length - 1 ? 1 : 0.4); // Newest scan is opaque, older scans fade
        });
      };


      const drawChart = () => {
        const svgElement = d3.select(svg.value)
        svgElement.selectAll('*').remove()

        const avg_data = chartData.average.map(({frequency, power}: {frequency: number, power: number}) => [frequency, power])
        const peak_data = chartData.peak.map(({frequency, power}: {frequency: number, power: number}) => [frequency, power])
        const last_scan = chartData.last_scan?.scan_data.map(({frequency, power}: {frequency: number, power: number}) => [frequency, power]) || []
        console.log(last_scan)


        // console.log(data)
        const chartGroup = svgElement
          .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`)

        const xScale = d3.scaleLinear([470, 608], chartWidth.value)
        const yScale = d3.scaleLinear([-120, -20], chartHeight.value)

        const line = d3
          .line()
          .x((d) => xScale(d[0]))
          .y((d) => yScale(d[1]))

        chartGroup.append('path').datum(avg_data).attr('class', 'line').attr('d', line).style('stroke-width', .1)
        chartGroup.append('path').datum(peak_data).attr('class', 'line').attr('d', line).style('stroke-width', .1).style('stroke', 'red')
        chartGroup.append('path').datum(last_scan).attr('class', 'line').attr('d', line).style('stroke-width', .5).style('stroke', 'green')



        chartGroup
          .append('g')
          .attr('transform', `translate(0,${height.value - margin.top - margin.bottom})`)
          .call(d3.axisBottom(xScale).tickValues(d3.range(470, 608, 6)))

        chartGroup.append('g').call(d3.axisLeft(yScale))


        const xGrid = (g) => g
          .attr('class', 'grid-lines')
          .selectAll('line')
          .data(d3.range(470, 608, 6))
          .join('line')
          .attr('x1', d => xScale(d))
          .attr('x2', d => xScale(d))
          .attr('y1', 0)
          .attr('y2', chartHeight.value[0])
        chartGroup
          .append('g').call(xGrid)


      }


      async function getData() {
        const url = "http://localhost:8000/api/scanner/1/scans"
        try {
          const response = await fetch(url)
          if (!response.ok) {
            console.log("err" + response.status)
          }
          return await response.json()
        } catch (e) {
          console.error(e)
        }
      }

      // watch(() => width.value,
      //   () => {
      //     drawChart()
      //   }
      // )

      // onMounted(() => {
      //   const data = getData().then(data => {
      //     chartData = data
      //     console.log(chartData.peak)
      //     console.log(chartData.average)
      //
      //     drawChart()
      //   })
      // })

      return {
        svg,
        width,
        height,
        chartHeight,
      }
    }
  })
</script>
