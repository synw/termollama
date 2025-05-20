import { processAction } from "./actionbar.js";
import { getGPUMemoryInfo, gpuDetailsStats, ramStats } from "./lib/bars/gpus.js";
import { ps } from "./lib/ps.js";

async function mainCmd(options: Record<string, any>) {
    const { hasGPU, info } = getGPUMemoryInfo();
    const { models, hasOffload, isRunning } = await ps(false);
    const w = options.watch ?? false;
    if (hasGPU) {
        if (info.cards.length > 1) {
            gpuDetailsStats(info, models, w, options?.maxModelBars);
        }
    }
    if ((!hasGPU || hasOffload!) && !w) {
        ramStats(hasGPU);
    }
    if (isRunning && !w) {
        await processAction(options);
    }
}

export {
    mainCmd
};
