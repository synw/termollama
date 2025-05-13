import { GPUCardInfo, GPUInfo, TotalMemoryInfo } from '../interfaces.js';
import { execute } from './execute.js';

async function getGPUCardsInfo(): Promise<{ hasGPU: boolean, cards: Array<GPUCardInfo> }> {
    // Execute nvidia-smi command to get memory usage and total memory information
    let hasSmiCommand = true;
    const res = await execute("nvidia-smi", ["--query-gpu=index,memory.total,memory.used,power.draw,power.limit,temperature.gpu", "--format=csv,noheader,nounits"],
        { onError: () => hasSmiCommand = false }
    );
    if (!hasSmiCommand) {
        return { hasGPU: false, cards: {} as Array<GPUCardInfo> }
    }
    const t = res.trim().split('\n');
    //console.log("t", t);
    const gpus = new Array<Array<number>>();
    t.forEach(row => {
        //console.log("row", row);
        if (row.length > 0) {
            gpus.push(row.split(', ').map(value => parseFloat(value.trim())))
        }
    });
    //console.log("pinfo", gpus);
    const cards = new Array<GPUCardInfo>();
    gpus.forEach(row => {
        const totalMemoryBytes = Math.round(Number(row[1]) * 1048576);
        const usedMemoryBytes = Math.round(Number(row[2]) * 1048576);
        const totalMemory: TotalMemoryInfo = {
            totalMemoryBytes: totalMemoryBytes,
            usedMemoryBytes: usedMemoryBytes,
            usagePercentage: parseFloat(((usedMemoryBytes / totalMemoryBytes) * 100).toFixed(1))
        }
        const card: GPUCardInfo = {
            index: row[0],
            memory: totalMemory,
            powerDraw: parseInt(Math.round(row[3]).toString()),
            powerLimit: row[4],
            temperature: row[5],
        };
        cards.push(card);
    });
    return { hasGPU: true, cards: cards }
}
async function getTotalGPUMem(): Promise<number> {
    const { hasGPU, cards } = await getGPUCardsInfo();
    if (!hasGPU) {
        return 0
    }
    let totalMemoryBytes = 0;
    cards.map(c => {
        totalMemoryBytes += c.memory.totalMemoryBytes;
    });
    return totalMemoryBytes
}

function getGPUOccupationPercent(totalGPUMem: number, memOccupation: number): number {
    const p = parseFloat(((memOccupation / totalGPUMem) * 100).toFixed(1));
    return p
}

/**
 * Gets current and total memory capacity for all NVIDIA GPUs in GB
 * @returns {Object} Object containing array of GPU information and total memory details
 */
async function getGPUMemoryInfo(): Promise<{ hasGPU: boolean, info: GPUInfo }> {
    const { hasGPU, cards } = await getGPUCardsInfo();
    //console.log("cards", cards);
    if (!hasGPU) {
        return { hasGPU: false, info: {} as GPUInfo };
    }
    let totalMemoryBytes = 0;
    let usedMemoryBytes = 0;
    cards.forEach(c => {
        totalMemoryBytes += c.memory.totalMemoryBytes;
        usedMemoryBytes += c.memory.usedMemoryBytes;
    });
    const totalUsagePercentage = (usedMemoryBytes / totalMemoryBytes) * 100;
    const info: GPUInfo = {
        totalMemory: {
            totalMemoryBytes: totalMemoryBytes,
            usedMemoryBytes: usedMemoryBytes,
            usagePercentage: parseFloat(totalUsagePercentage.toFixed(1))
        },
        cards: cards,
    }
    return { hasGPU: true, info: info }
}


export {
    getGPUMemoryInfo,
    getGPUOccupationPercent,
    getTotalGPUMem,
}