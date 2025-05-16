import { getGPUMemoryInfo, gpuTotalStats, gpuDetailsStats, ramStats } from "./lib/bars/gpus.js";
import { actionBar } from "./actionbar.js";
import { setCtx } from "./ctx.js";
import { StateOptions } from "./interfaces.js";
import { keepAlive } from "./keepalive.js";
import { ollamaPsOrQuit, ps } from "./lib/ps.js";
import { getModelsData, modelsMemChart } from "./lib/models.js";
import { load } from "./load.js";
import { unload } from "./unload.js";

async function mainCmd(options: Record<string, any>) {
    const { hasGPU, info } = await getGPUMemoryInfo();
    const { models, hasOffload, isRunning } = await ps(false);
    if (hasGPU) {
        if (info.cards.length > 1) {
            const w = options.watch ?? false;
            await gpuDetailsStats(info, models, w, true);
        }
    }
    //console.log("has Gpu", hasGPU);
    //console.log("has offload", hasOffload);
    //console.log("has loaded models", hasLoadedModels);
    /*if (hasGPU && !options.watch) {
        await gpuTotalStats(info);
    }*/
    if (!hasGPU || hasOffload!) {
        ramStats(hasGPU);
    }
    if (isRunning!) {
        //await processAction(options);
    }
}


async function processAction(options: StateOptions) {
    const k = await actionBar();
    switch (k) {
        case "l":
            await load([]);
            break;
        case "k":
            await keepAlive(await ollamaPsOrQuit());
            break;
        case "u":
            await unload(await ollamaPsOrQuit());
            break
        case "c":
            await setCtx(await ollamaPsOrQuit());
            break
        case "m":
            modelsMemChart(await ollamaPsOrQuit());
            await processAction(options);
            break
        default:
            process.exit(0)
    }
}

export {
    mainCmd,
}