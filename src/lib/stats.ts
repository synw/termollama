import os from "os";
import { MultiBar, SingleBar } from "cli-progress";
import color from "ansi-colors";
import { ListResponse } from "ollama/dist/index.js";
// @ts-ignore
import TsCharts from "tcharts.js";
import { GPUCardInfo, GPUInfo, TotalMemoryInfo } from "../interfaces.js";
import { formatFileSize } from "./utils.js";

interface CardBarInfo {
    index: number;
    totalMemory: number;
    usedMemory: number;
    displayBar: string;
    displayMemory: string;
    usedMemoryPercent: number;
    powerDraw: number;
    powerPercent: number;
    powerLimit: number;
    displayTemperature: string;
    powerDrawPercent: number;
}

function memStats(info: GPUInfo) {
    if (info.cards.length > 1) {
        const barData = new Array<CardBarInfo>();
        const displayBar = "GPU {index} [{bar}] {percentage}%";
        const displayGpu = '{displayUsedMemory} used - {displayFreeMemory} free';
        const displayMemory = '{displayMemory}';
        const displayWatt = "{powerDraw}W " + color.dim("{powerPercent}%");
        const displayTemp = "{displayTemperature}";
        const formatMaxLength = {
            gpu: 0,
            temp: 0,
        };
        for (const gpu of info.cards) {
            //console.log(gpu)            
            const usedMemoryPercent = (gpu.memory.usedMemoryBytes / gpu.memory.totalMemoryBytes) * 100;
            const dum = formatFileSize(gpu.memory.totalMemoryBytes - gpu.memory.usedMemoryBytes);
            const duf = formatFileSize(gpu.memory.usedMemoryBytes);
            const dg = displayGpu.replace("{displayUsedMemory}", duf)
                .replace("{displayFreeMemory}", dum);
            const dt = `${gpu.temperature}°C`;
            const dtf = gpu.temperature < 30 ? dt : color.bold(`${gpu.temperature}°C`);
            const tl = displayTemp.replace("{displayTemperature}", dt);
            if (dg.length > formatMaxLength.gpu) {
                formatMaxLength.gpu = dg.length;
            }
            if (tl.length > formatMaxLength.temp) {
                formatMaxLength.temp = tl.length;
            }
            const info: CardBarInfo = {
                displayBar: displayBar,
                displayMemory: dg,
                totalMemory: gpu.memory.totalMemoryBytes,
                usedMemory: gpu.memory.usedMemoryBytes,
                index: gpu.index,
                usedMemoryPercent: usedMemoryPercent,
                powerDraw: gpu.powerDraw,
                powerLimit: gpu.powerLimit,
                powerPercent: parseInt(((gpu.powerDraw / gpu.powerLimit) * 100).toString()),
                powerDrawPercent: parseInt(((gpu.powerDraw / gpu.powerLimit) * 100).toString()),
                displayTemperature: dtf,
            };
            barData.push(info);
        };
        const format = new Array<string>(displayBar, displayMemory, displayTemp, displayWatt);
        const multibar = new MultiBar({
            autopadding: true,
            barCompleteChar: '=',
            barIncompleteChar: '.',
            hideCursor: true,
            format: format.join(" | "),
        });
        let i = 0;
        for (const _ of info.cards) {
            const data = barData[i];
            if (formatMaxLength.gpu > data.displayMemory.length) {
                data.displayMemory = data.displayMemory.padEnd(formatMaxLength.gpu, " ");
            }
            if (displayTemp.length > data.displayTemperature.length) {
                data.displayTemperature = data.displayTemperature.padEnd(formatMaxLength.temp, " ");
            }
            multibar.create(data.totalMemory, data.usedMemory, data);
            ++i
        }
        multibar.stop();
    }
}

function ramStats(hasGpu: boolean) {
    const yellow = hasGpu ? color.yellow : color.yellowBright;
    const green = hasGpu ? color.green : color.greenBright;
    const bar = new SingleBar({
        format: `RAM [{bar}] ${color.bold("{percentage}%")} | ${yellow("{used}")} used / ${green("{free}")} free`,
        barCompleteChar: "=",
        barIncompleteChar: '.',
        hideCursor: true
    });
    const totalRam = os.totalmem();
    const freeRam = os.freemem();
    const usedRam = totalRam - freeRam;
    bar.start(totalRam, usedRam, {
        free: formatFileSize(totalRam - usedRam),
        used: formatFileSize(usedRam),
    });
    bar.stop()
}

function memTotalStats(info: {
    cards: GPUCardInfo[];
    totalMemory: TotalMemoryInfo;
}) {
    let totalPowerDraw = 0;
    let totalPowerLimit = 0;
    for (const card of info.cards) {
        totalPowerDraw += card.powerDraw;
        totalPowerLimit += card.powerLimit;
    }
    const totalPowerPercentage = Math.round(totalPowerDraw / totalPowerLimit * 100);
    const bar = new SingleBar({
        format: `GPU [{bar}] ${color.bold("{percentage}%")} | ${color.yellowBright("{used}")} used / ${color.greenBright("{free}")} free | {totalPowerDraw}W ${color.dim("{totalPowerPercentage}%")}`,
        barCompleteChar: "=",
        barIncompleteChar: '.',
        hideCursor: true
    });
    //console.log("t", info.totalMemory.totalMemoryBytes, "u", info.totalMemory.usedMemoryBytes);
    bar.start(info.totalMemory.totalMemoryBytes, info.totalMemory.usedMemoryBytes, {
        free: formatFileSize(info.totalMemory.totalMemoryBytes - info.totalMemory.usedMemoryBytes),
        used: formatFileSize(info.totalMemory.usedMemoryBytes),
        totalPowerDraw: totalPowerDraw,
        totalPowerPercentage: totalPowerPercentage,
    });
    bar.stop()
}

function modelsMemChart(modelsData: ListResponse) {
    if (modelsData.models.length == 0) {
        return
    }
    const { Box } = TsCharts;
    const box = new Box(110, 10);
    const data = new Array<{ name: string, value: number }>();
    modelsData.models.forEach((m) => {
        const size = m?.size_vram ? m.size_vram : m.size;
        //console.log("M", m, size);
        data.push({ name: `${m.name}(${formatFileSize(size)}) `, value: size })
    });
    box.setData(data);
    console.log(box.string());
}

export { memStats, memTotalStats, modelsMemChart, ramStats };
