import { Command } from "@commander-js/extra-typings";
import { actionBar } from "./actionbar.js";
import { setCtx } from "./ctx.js";
import { confEnv } from "./env.js";
import { ServeOptions, StateOptions } from "./interfaces.js";
import { keepAlive } from "./keepalive.js";
import { getGPUMemoryInfo } from "./lib/gpu.js";
import { memStats, memTotalStats, modelsMemChart } from "./lib/stats.js";
import { load } from "./load.js";
import { models } from "./models.js";
import { ggufOptions, serveOptions, stateOptions } from "./options.js";
import { ollamaPsOrQuit, ps } from "./ps.js";
import { serve } from "./serve.js";
import { unload } from "./unload.js";
import { gguf } from "./gguf/gguf.js";

function initCommands(program: Command) {
    const serveCmd = program.command("serve")
        .description("run an Ollama server")
        .alias("s")
        .action(async (options) => await serve(options as ServeOptions));
    serveOptions.forEach(o => serveCmd.addOption(o));
    const envCmd = program.command("env").alias("e")
        .description("show the Ollama environment variables used")
        .action(async (options) => await confEnv());
    stateOptions.forEach(o => envCmd.addOption(o));
    const memCmd = program.command("mem")
        .description("show a chart of gpu memory used by models")
        .action(async (options) => modelsMemChart(await ollamaPsOrQuit()));;
    stateOptions.forEach(o => memCmd.addOption(o));
    const modelsCmd = program.command("models").alias("m")
        .description("show a list of models, optional keyword filters")
        .argument("[filters...]", "filter model names: ex 'olm -m qwen mistral'")
        .action(async (filters) => await models(filters));
    stateOptions.forEach(o => modelsCmd.addOption(o));
    const ctxCmd = program.command("ctx").alias("c")
        .description("set context length for a model loaded in memory")
        .action(async (options) => await setCtx(await ollamaPsOrQuit()));
    stateOptions.forEach(o => ctxCmd.addOption(o));
    const loadCmd = program.command("load")
        //.alias("l")
        .description("load a model in memory, optional keywords filters")
        .argument("[filters...]", "filter model names: ex 'olm -m qwen mistral'")
        .action(async (filters) => await load(filters));
    stateOptions.forEach(o => loadCmd.addOption(o));
    const unloadCmd = program.command("unload")
        //.alias("u")
        .description("unload a model from memory")
        .action(async (options) => await unload(await ollamaPsOrQuit()));
    stateOptions.forEach(o => unloadCmd.addOption(o));
    const keepAliveCmd = program.command("keep-alive").alias("k")
        .description("set the keep alive value for a model")
        .action(async (options) => await keepAlive(await ollamaPsOrQuit()));
    stateOptions.forEach(o => keepAliveCmd.addOption(o));
    const ggufCmd = program.command("gguf").alias("g")
        .description("provides gguf files info")
        .action(async (options) => await gguf(options));
    ggufOptions.forEach(o => ggufCmd.addOption(o));
    const statsCmd = program.command("default", { isDefault: true })
        .description("show gpu usage statistics")
        .action(async (options) => {
            const info = getGPUMemoryInfo();
            if (info.cards.length > 1) {
                memStats(info);
            }
            await ps(false);
            memTotalStats(info);
            await processAction(options);
        });
    stateOptions.forEach(o => statsCmd.addOption(o));
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
    initCommands
};
