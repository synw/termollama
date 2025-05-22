import { processAction } from "./actionbar.js";
import { gpuDetailsStats, ramStats } from "./lib/bars/gpus.js";
import { ps } from "./lib/ps.js";
import { memInfo } from "./state.js";

async function mainCmd(options: Record<string, any>) {
    const { models, hasOffload, isRunning } = await ps();
    const w = options.watch ?? false;
    if (memInfo.hasGpu) {
        if (memInfo.gpu.cards.length > 0) {
            gpuDetailsStats(memInfo.gpu, models, w, options?.maxModelBars);
        }
    }
    if ((!memInfo.hasGpu || hasOffload!) && !w) {
        ramStats(memInfo.hasGpu);
    }
    if (isRunning && !w) {
        await processAction(options);
    }
}

export {
    mainCmd
};
