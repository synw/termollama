import { GPUCardInfo, GPUInfo, TotalMemoryInfo } from '../interfaces.js';
import { execute } from './execute.js';

async function getGPUCardsInfo(): Promise<{ ok: boolean, hasGPU: boolean, cards: Array<GPUCardInfo> }> {
    // Execute nvidia-smi command to get memory usage and total memory information
    let hasSmiCommand = true;
    const res = await execute("nvidia-smi", ["--query-gpu=index,memory.total,memory.used,power.draw,power.limit,temperature.gpu", "--format=csv,noheader,nounits"],
        { onError: () => hasSmiCommand = false }
    );
    if (!hasSmiCommand) {
        return { ok: false, hasGPU: false, cards: [] };
    }
    const t = res.trim().split('\n');
    const gpus = new Array<Array<number>>();
    for (const row of t) {
        if (row.length > 0) {
            const parsedRow = row.split(', ').map(value => parseFloat(value.trim()));
            // Validate that all values are numbers and the row has the expected number of columns
            if (parsedRow.length === 6 && parsedRow.every(value => !isNaN(value))) {
                gpus.push(parsedRow);
            } else {
                //console.error(`Invalid GPU card data: ${row}`);
                return { ok: false, hasGPU: false, cards: [] };
            }
        }
    }
    const cards = new Array<GPUCardInfo>();
    for (const row of gpus) {
        const totalMemoryBytes = Math.round(Number(row[1]) * 1048576);
        const usedMemoryBytes = Math.round(Number(row[2]) * 1048576);
        try {
            const totalMemory: TotalMemoryInfo = {
                totalMemoryBytes: totalMemoryBytes,
                usedMemoryBytes: usedMemoryBytes,
                usagePercentage: calculateUsagePercentage(usedMemoryBytes, totalMemoryBytes)
            };
            const card: GPUCardInfo = {
                index: row[0],
                memory: totalMemory,
                powerDraw: parseInt(Math.round(row[3]).toString()),
                powerLimit: row[4],
                temperature: row[5],
            };
            cards.push(card);
        } catch (error) {
            throw new Error(`Error processing GPU card with data: ${row} ${error}`);
            //sreturn { ok: false, hasGPU: false, cards: [] };
        }
    }
    return { ok: true, hasGPU: true, cards: cards };
}

async function getTotalGPUMem(): Promise<number> {
    const { hasGPU, cards } = await getGPUCardsInfo();
    if (!hasGPU) {
        return 0;
    }
    let totalMemoryBytes = 0;
    cards.forEach(c => {
        totalMemoryBytes += c.memory.totalMemoryBytes;
    });
    return totalMemoryBytes;
}

function calculateUsagePercentage(used: number, total: number): number {
    if (typeof used !== 'number' || typeof total !== 'number') {
        throw new Error(`Error: Invalid input types. Used: ${typeof used}, Total: ${typeof total}`);
    }
    if (total === 0) {
        throw new Error("Error: Division by zero encountered in usage percentage calculation.");
    }
    const p = parseFloat(((used / total) * 100).toFixed(1));
    if (isNaN(p)) {
        throw new Error(`Error: Formatting NaN in usage percentage calculation. Used: ${used}, Total: ${total}`);
    }
    return p;
}

function getGPUOccupationPercent(totalGPUMem: number, memOccupation: number): number {
    if (typeof totalGPUMem !== 'number' || typeof memOccupation !== 'number') {
        throw new Error(`Error: Invalid input types. Total GPU Mem: ${typeof totalGPUMem}, Mem Occupation: ${typeof memOccupation}`);
    }
    if (totalGPUMem === 0) {
        throw new Error("Error: Division by zero encountered in GPU occupation percent calculation.");
    }
    const p = parseFloat(((memOccupation / totalGPUMem) * 100).toFixed(1));
    if (isNaN(p)) {
        throw new Error(`Error: Formatting NaN in GPU occupation percent calculation. Total GPU Mem: ${totalGPUMem}, Mem Occupation: ${memOccupation}`);
    }
    return p;
}

/**
 * Gets current and total memory capacity for all NVIDIA GPUs in GB
 * @returns {Object} Object containing array of GPU information and total memory details
 */
async function getGPUMemoryInfo(): Promise<{ hasGPU: boolean, info: GPUInfo, success: boolean }> {
    const { hasGPU, cards, ok } = await getGPUCardsInfo();
    if (!ok) {
        return { hasGPU: hasGPU, info: {} as GPUInfo, success: false };
    }
    if (!hasGPU) {
        return { hasGPU: false, info: {} as GPUInfo, success: ok };
    }
    let totalMemoryBytes = 0;
    let usedMemoryBytes = 0;
    cards.forEach(c => {
        totalMemoryBytes += c.memory.totalMemoryBytes;
        usedMemoryBytes += c.memory.usedMemoryBytes;
    });
    try {
        const totalUsagePercentage = calculateUsagePercentage(usedMemoryBytes, totalMemoryBytes);
        const info: GPUInfo = {
            totalMemory: {
                totalMemoryBytes: totalMemoryBytes,
                usedMemoryBytes: usedMemoryBytes,
                usagePercentage: totalUsagePercentage
            },
            cards: cards,
        };
        return { hasGPU: true, info: info, success: true };
    } catch (error) {
        console.error("Error calculating total GPU memory usage percentage:", error);
        throw error;
    }
}

export {
    getGPUMemoryInfo,
    getGPUOccupationPercent,
    getTotalGPUMem,
}