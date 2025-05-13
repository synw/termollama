import os from "os";
import { SingleBar } from "cli-progress";
import color from "ansi-colors";
import { ListResponse } from "ollama/dist/index.js";
// @ts-ignore
import TsCharts from "tcharts.js";
import { GPUCard, TotalMemoryInfo } from "../interfaces.js";
import { formatFileSize } from "./utils.js";


function memStats(info: {
    cards: GPUCard[];
    totalMemory: TotalMemoryInfo;
}) {
    if (info.cards.length > 1) {
        for (const gpu of info.cards) {
            //console.log(gpu)
            const bar = new SingleBar({
                format: `GPU ${gpu.index} [{bar}] {percentage}% | {used} used / {free} free`,
                barCompleteChar: '=',
                barIncompleteChar: '.',
                hideCursor: true,
            });
            bar.start(gpu.totalMemoryBytes, gpu.usedMemoryBytes, {
                free: formatFileSize(gpu.totalMemoryBytes - gpu.usedMemoryBytes),
                used: formatFileSize(gpu.usedMemoryBytes),
                gpuIndex: gpu.index,
            });
            bar.stop()
        }
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
    cards: GPUCard[];
    totalMemory: TotalMemoryInfo;
}) {
    //console.log("MTS", info)
    const bar = new SingleBar({
        format: `GPU [{bar}] ${color.bold("{percentage}%")} | ${color.yellowBright("{used}")} used / ${color.greenBright("{free}")} free`,
        barCompleteChar: "=",
        barIncompleteChar: '.',
        hideCursor: true
    });
    //console.log("t", info.totalMemory.totalMemoryBytes, "u", info.totalMemory.usedMemoryBytes);
    bar.start(info.totalMemory.totalMemoryBytes, info.totalMemory.usedMemoryBytes, {
        free: formatFileSize(info.totalMemory.totalMemoryBytes - info.totalMemory.usedMemoryBytes),
        used: formatFileSize(info.totalMemory.usedMemoryBytes),
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
