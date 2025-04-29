import { execSync } from 'node:child_process';
import { GPUCard, TotalMemoryInfo } from '../interfaces.js';
import { gpus } from '../state.js';
import { CommandChecker } from './utils.js';


async function getTotalGPUMem(): Promise<number> {
    const exists = await CommandChecker.commandExists("nvidia-smi");
    if (!exists) {
        return 0
    }
    let gpuInfo = new Array<string>();
    try {
        gpuInfo = execSync(
            'nvidia-smi --query-gpu=index,name,memory.total,memory.used --format=csv,noheader,nounits'
        )
            .toString()
            .trim()
            .split('\n');
    } catch (error: any) {
        if (error.code && error.code !== 0) {
            console.error('Error executing nvidia-smi command:', error);
            if (error.stderr) {
                console.error('stderr:', error.stderr.toString());
            }
        } else {
            console.log('Command not found or other issue');
        }
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
    const exists = await CommandChecker.commandExists("nvidia-smi");
    if (!exists) {
        throw new Error("no nvidia-smi command")
    }
    // Execute nvidia-smi command to get memory usage and total memory information
    const gpuInfo = execSync('nvidia-smi --query-gpu=index,name,memory.total,memory.used --format=csv,noheader,nounits')
        .toString()
        .trim()
        .split('\n');

    // Process each GPU's information
    let totalMemoryBytes = 0;
    let usedMemoryBytes = 0;

    const hasGpusConf = gpus.length > 0;
    const cards = gpuInfo.map(gpu => {
        const [index, name, memoryTotalMiB, memoryUsedMiB] = gpu.split(',');
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
}