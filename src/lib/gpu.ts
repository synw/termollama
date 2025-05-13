import { GPUCard, TotalMemoryInfo } from '../interfaces.js';
import { gpus } from '../state.js';
import { execute } from './execute.js';

async function getGPUInfo(): Promise<Array<string>> {
    let gpuInfo: Array<string> = [];
    // Execute nvidia-smi command to get memory usage and total memory information
    //gpuInfo = execSync('nvidia-smix --query-gpu=index,name,memory.total,memory.used --format=csv,noheader,nounits')
    const res = await execute("nvidia-smi", ["--query-gpu=index,name,memory.total,memory.used", "--format=csv,noheader,nounits"],
        { onError: () => null }
    );
    //console.log("res", res);
    gpuInfo = res.trim().split('\n');
    const final = new Array<string>();
    gpuInfo.forEach((gpu) => {
        if (gpu !== "") {
            final.push(gpu)
        }
    });
    //console.log("GPU INFO", gpuInfo);
    return final
}

async function systemHasGpu(): Promise<boolean> {
    const gpuInfo = await getGPUInfo();
    return gpuInfo[0] !== ""
}

async function getTotalGPUMem(): Promise<number> {
    const gpuInfo = await getGPUInfo();
    if (gpuInfo[0] == "") {
        return 0
    }
    // Process each GPU's information
    let totalMemoryBytes = 0;
    gpuInfo.map(gpu => {
        const [index, name, memoryTotalMiB, memoryUsedMiB] = gpu.split(',');
        const memoryTotalBytesCard = Math.round(Number(memoryTotalMiB) * 1048576);
        totalMemoryBytes += memoryTotalBytesCard
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
async function getGPUMemoryInfo(): Promise<{ cards: GPUCard[], totalMemory: TotalMemoryInfo }> {
    const gpuInfo = await getGPUInfo();
    //console.log("GPU info", gpuInfo);
    if (gpuInfo[0] == "") {
        return { cards: [], totalMemory: {} as TotalMemoryInfo }
    }
    // Process each GPU's information
    let totalMemoryBytes = 0;
    let usedMemoryBytes = 0;

    const hasGpusConf = gpus.length > 0;
    //console.log("GPU info", gpuInfo);
    const cards = gpuInfo.map(gpu => {
        const [index, name, memoryTotalMiB, memoryUsedMiB] = gpu.split(',');
        //console.log("Info", index, name, memoryTotalMiB, memoryUsedMiB);
        const memoryTotalBytesCard = Math.round(Number(memoryTotalMiB) * 1048576);
        const memoryUsedBytesCard = Math.round(Number(memoryUsedMiB) * 1048576);

        //const memoryTotalGBCard = Number(memoryTotalMiB) / 1024;
        //const memoryUsedGBCard = Number(memoryUsedMiB) / 1024;

        const idx = Number(index);
        if (hasGpusConf) {
            if (gpus.includes(idx)) {
                totalMemoryBytes += memoryTotalBytesCard;
                usedMemoryBytes += memoryUsedBytesCard;
            }
        } else {
            totalMemoryBytes += memoryTotalBytesCard;
            usedMemoryBytes += memoryUsedBytesCard;
        }

        return {
            index: idx,
            name,
            totalMemoryBytes: memoryTotalBytesCard,
            usedMemoryBytes: memoryUsedBytesCard,
            usagePercentage: parseFloat(((memoryUsedBytesCard / memoryTotalBytesCard) * 100).toFixed(1))
        };
    });

    const totalUsagePercentage = (usedMemoryBytes / totalMemoryBytes) * 100;

    const nc = new Array<GPUCard>();
    if (gpus.length > 0) {
        let i = 0;
        cards.forEach((c) => {
            if (gpus.includes(c.index)) {
                nc.push(c)
            }
            ++i;

        })
    } else {
        nc.push(...cards)
    }

    return {
        cards: nc,
        totalMemory: {
            totalMemoryBytes: totalMemoryBytes,
            usedMemoryBytes: usedMemoryBytes,
            usagePercentage: parseFloat(totalUsagePercentage.toFixed(1))
        }
    };
}


export {
    getGPUMemoryInfo,
    getGPUOccupationPercent,
    getTotalGPUMem,
    systemHasGpu,
}