import os from "os";
import { MultiBar, SingleBar } from "cli-progress";
import color from "ansi-colors";
import { CardBarInfo, ExtendedModelData, GPUCardInfo, GPUInfo, TotalMemoryInfo } from "../../interfaces.js";
import { formatFileSize } from "../utils.js";
import { getGPUMemoryInfo } from "../gpu.js";
import { formatModelData, modelBarOptions } from "./models.js";

const tagBar = "GPU {displayIndex} [{bar}] {percentage}%";
const tagMemFinal = '{displayMem}';
const tagMemFree = '{displayFreeMem}';
const tagMemUsed = '{displayUsedMem} used';
const tagPower = "{displayPowerDraw}";
const tagPowerPercent = "{powerPercent}%";
const tagTemp = "{displayTemperature}";
const tagFormat = new Array<string>(tagBar, tagMemFinal, tagTemp, tagPower, tagPowerPercent).join(" | ");
const totalBarTagFormat = new Array<string>(tagBar, tagMemFinal, tagPower, tagPowerPercent).join(" | ");

function padCardInfo(data: CardBarInfo): CardBarInfo {
    if (data.formatMaxLength.gpuFinal > data.displayMem.length) {
        data.displayMem = data.displayMem.padEnd(data.formatMaxLength.gpuFinal);
    }
    if (data.formatMaxLength.temp > data.displayTemperature.length) {
        data.displayTemperature = data.displayTemperature.padEnd(data.formatMaxLength.temp);
    }
    /*if (data.formatMaxLength.power > data.displayPowerDraw.toString().length) {
        data.displayPowerDraw = data.displayPowerDraw.toString().padEnd(data.formatMaxLength.power);
    }*/
    return data
}

function calcSectionsLengthAndFormat(
    data: CardBarInfo,
    colorizeMem = false,
    colorizePower = true,
): CardBarInfo {
    const freeMem = data.totalMemory - data.usedMemory;
    const formatedGpuFree = tagMemFree.replace(`{displayFreeMem}`, formatFileSize(freeMem));
    const formatedGpuUsed = tagMemUsed.replace(`{displayUsedMem}`, formatFileSize(data.usedMemory));
    const dt = `${data.temperature}°C`;
    let dtf: string;
    if (data.temperature < 30) {
        dtf = color.green(dt)
    } else if (data.temperature < 50) {
        dtf = color.greenBright(dt)
    } else if (data.temperature < 70) {
        dtf = color.yellowBright(dt)
    } else {
        dtf = color.redBright(dt)
    }
    const pwd = data.powerDraw.toString() + " W";
    let xwft: string
    if (colorizePower) {
        xwft = pwd;
        if (data.powerPercent > 30) {
            xwft = color.yellowBright(pwd)
        } else {
            if (data.powerPercent >= 100) {
                xwft = xwft
            } else {
                xwft = xwft + " "
            }
        }
    } else {
        xwft = pwd
    }
    const formatedTemp = tagTemp.replace("{displayTemperature}", dtf);
    const formatedPower = tagPower.replace("{displayPowerDraw}", xwft);
    let formatedMemFinal: string
    if (colorizeMem) {
        formatedMemFinal = color.yellowBright(formatedGpuUsed) + " " + color.greenBright(`${formatedGpuFree} free`);
    } else {
        formatedMemFinal = formatedGpuUsed + color.dim(` ${formatedGpuFree} free`);
    }
    if (formatedMemFinal.length > data.formatMaxLength.gpuFinal) {
        data.formatMaxLength.gpuFinal = formatedMemFinal.length;
    }
    if (formatedTemp.length > data.formatMaxLength.temp) {
        data.formatMaxLength.temp = formatedTemp.length;
    }
    if (formatedPower.length > data.formatMaxLength.power) {
        data.formatMaxLength.power = formatedPower.length;
    }
    data.displayMem = formatedMemFinal;
    data.displayFreeMem = formatedGpuFree;
    data.displayUsedMem = formatedGpuUsed;
    data.displayTemperature = formatedTemp;
    data.displayPowerDraw = formatedPower;
    return data
}

function _updateInfo(): Array<CardBarInfo> {
    const { info, success } = getGPUMemoryInfo();
    if (!success) {
        // skip this cycle
        return []
    }
    const barData = new Array<CardBarInfo>();
    const formatMaxLength = {
        gpuUsed: 0,
        gpuFree: 0,
        gpuFinal: 0,
        temp: 0,
        power: 0,
    };
    let totalPowerDraw = 0;
    let totalPowerLimit = 0;
    let totalUsedMemoryBytes = 0;
    let totalFreeMemoryBytes = 0;
    for (const gpu of info.cards) {
        const usedMemoryPercent = (gpu.memory.usedMemoryBytes / gpu.memory.totalMemoryBytes) * 100;
        const freeMem = gpu.memory.totalMemoryBytes - gpu.memory.usedMemoryBytes; // Corrected calculation
        const barInfo: CardBarInfo = {
            totalMemory: gpu.memory.totalMemoryBytes,
            usedMemory: gpu.memory.usedMemoryBytes,
            freeMemory: freeMem, // Updated to use the correct free memory calculation
            index: gpu.index,
            usedMemoryPercent: usedMemoryPercent,
            formatMaxLength: formatMaxLength,
            powerDraw: gpu.powerDraw,
            powerLimit: gpu.powerLimit,
            powerPercent: Math.round(((gpu.powerDraw / gpu.powerLimit) * 100)),
            temperature: gpu.temperature,
            displayIndex: gpu.index.toString(),
            displayTemperature: "",
            displayMem: "",
            displayFreeMem: "",
            displayUsedMem: "",
            displayPowerDraw: "",
        };
        const finalData = calcSectionsLengthAndFormat(barInfo);
        barData.push(finalData);
        // Aggregate total statistics
        totalPowerDraw += gpu.powerDraw;
        totalPowerLimit += gpu.powerLimit;
        totalUsedMemoryBytes += gpu.memory.usedMemoryBytes;
        totalFreeMemoryBytes += freeMem;
    }
    const totalPowerPercentage = Math.round((totalPowerDraw / totalPowerLimit) * 100);
    const totalCardInfo: CardBarInfo = {
        index: -1,
        totalMemory: info.totalMemory.totalMemoryBytes,
        usedMemory: totalUsedMemoryBytes,
        freeMemory: totalFreeMemoryBytes,
        usedMemoryPercent: (totalUsedMemoryBytes / info.totalMemory.totalMemoryBytes) * 100,
        powerDraw: totalPowerDraw,
        powerLimit: totalPowerLimit,
        temperature: 0,
        powerPercent: totalPowerPercentage,
        displayTemperature: "",
        displayMem: "",
        displayFreeMem: "",
        displayUsedMem: "",
        displayPowerDraw: "",
        displayIndex: "+",
        formatMaxLength: {
            gpuUsed: 0,
            gpuFree: 0,
            gpuFinal: 0,
            temp: 0,
            power: 0,
        },
    };
    const finalData = calcSectionsLengthAndFormat(totalCardInfo, true, false);
    barData.push(finalData);
    return barData;
}

function gpuDetailsStats(
    info: GPUInfo,
    models: Array<ExtendedModelData>,
    realTime: boolean,
    displayTotal: boolean = true,
) {
    //console.log("GTS", info)
    if (info.cards.length == 0) { return }
    const barData = _updateInfo()
    const multibar = new MultiBar({
        autopadding: true,
        barCompleteChar: '=',
        barIncompleteChar: '.',
        clearOnComplete: realTime,
        hideCursor: true,
        format: tagFormat,
        gracefulExit: true,
    });
    let i = 0;
    //console.log("INFO", info);
    const bars = new Array<SingleBar>();
    //console.log(barData.length);
    for (const _ of info.cards) {
        //console.log(card.index)
        const data = padCardInfo(barData[i]);
        bars.push(multibar.create(data.totalMemory, data.usedMemory, data));
        ++i
    }
    if (!realTime) {
        // models
        const modelBars = new Array<SingleBar>();
        models.forEach(m => {
            /*console.log(info.totalMemory.totalMemoryBytes, m.raw_size_vram)
            console.log(info.totalMemory.totalMemoryBytes - m.raw_size_vram)
            console.log("M", m);*/
            const md = formatModelData(m);
            modelBars.push(multibar.create(info.totalMemory.totalMemoryBytes, m.raw_size_vram,
                { output: md },
                modelBarOptions
            ))
        });
    }
    // total
    const tdata = padCardInfo(barData[3]);
    if (displayTotal) {
        const totalBar = multibar.create(
            barData[3].totalMemory, barData[i].usedMemory, tdata, {
            format: totalBarTagFormat
        }
        );
        bars.push(totalBar);
    }

    //multibar.log("Start bar\n")
    if (!realTime) {
        multibar.stop();
        return
    }
    // real time
    let b = 0;
    setInterval(() => {
        let nbarData: Array<CardBarInfo>;
        try {
            nbarData = _updateInfo();
        } catch (e) {
            multibar.stop()
            throw new Error(`bar info err: ${e}`)
        }

        //console.log("BL", barData.length);
        if (nbarData.length == 0) {
            // unsuccessful gpu info data fetch, skipping this cycle
            return
        }
        let i = 0;
        bars.forEach(b => {
            //console.log("BL", i, barData.length);
            const data = padCardInfo(nbarData[i]);
            b.update(nbarData[i].usedMemory, data);
            ++i
        });
        ++b
    }, 1000)
}

function gpuTotalStatsBar(info: {
    cards: GPUCardInfo[];
    totalMemory: TotalMemoryInfo;
}): SingleBar {
    const bar = new SingleBar({
        format: totalBarTagFormat,
        barCompleteChar: "=",
        barIncompleteChar: '.',
        autopadding: true,
        hideCursor: true
    });
    return bar
}

async function gpuTotalStats(info: {
    cards: GPUCardInfo[];
    totalMemory: TotalMemoryInfo;
}) {
    let totalPowerDraw = 0;
    let totalPowerLimit = 0;
    for (const card of info.cards) {
        totalPowerDraw += card.powerDraw;
        totalPowerLimit += card.powerLimit;
    }
    const bar = gpuTotalStatsBar(info);
    const barData = await _updateInfo();
    bar.start(info.totalMemory.totalMemoryBytes, info.totalMemory.usedMemoryBytes, barData[3]);
    bar.stop()
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

export {
    gpuTotalStats,
    gpuDetailsStats,
    ramStats,
    getGPUMemoryInfo,
};
