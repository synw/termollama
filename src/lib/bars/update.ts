import { CardBarInfo, GPUInfo } from "../../interfaces.js";
import { getGPUMemoryInfo } from "../gpu.js";
import { calcSectionsLengthAndFormat } from "./format.js";


function updateGpuBarsInfo(initialInfo?: GPUInfo): { success: boolean, cardsData: Array<CardBarInfo>, totalData: CardBarInfo } {
    //console.log("UPDATE", initialInfo != undefined)
    let info: GPUInfo;
    if (initialInfo) {
        info = initialInfo
    } else {
        const res = getGPUMemoryInfo();
        if (!res.success) {
            // skip this cycle
            return { success: false, cardsData: [], totalData: {} as CardBarInfo }
        }
        info = res.info
    }
    const cardsData = new Array<CardBarInfo>();
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
    const nCards = info.cards.length;
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
        const colorize = nCards == 1;
        const finalData = calcSectionsLengthAndFormat(barInfo, colorize, colorize);
        cardsData.push(finalData);
        // Aggregate totalData statistics
        totalPowerDraw += gpu.powerDraw;
        totalPowerLimit += gpu.powerLimit;
        totalUsedMemoryBytes += gpu.memory.usedMemoryBytes;
        totalFreeMemoryBytes += freeMem;
    }
    let totalCardInfo: CardBarInfo;
    if (info.cards.length == 1) {
        cardsData[0].displayIndex = " ";
        return { success: true, cardsData: [], totalData: cardsData[0] }
    }
    const totalPowerPercentage = Math.round((totalPowerDraw / totalPowerLimit) * 100);
    totalCardInfo = {
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
    }
    const finalData = calcSectionsLengthAndFormat(totalCardInfo, true, false);
    return { success: true, cardsData: cardsData, totalData: finalData };
}

export {
    updateGpuBarsInfo,
}