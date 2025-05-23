import { Command } from "commander";
import { confEnv } from "./env.js";
import { gguf } from "./gguf/gguf.js";
import { ServeOptions } from "./interfaces.js";
import { modelsMemChart } from "./lib/models.js";
import { ollamaPsOrQuit } from "./lib/ps.js";
import { load } from "./load.js";
import { mainCmd } from "./maincmd.js";
import { models } from "./models.js";
import { baseOptions, ggufOptions, loadOptions, serveOptions, stateOptions } from "./options.js";
import { serve } from "./serve.js";
import { unload } from "./unload.js";

function initCommands(program: Command) {
    const serveCmd = program.command("serve")
        .description("run an Ollama server")
        .alias("s")
        .action(async (options) => await serve(options as ServeOptions));
    serveOptions.forEach(o => serveCmd.addOption(o));
    program.command("env").alias("e")
        .description("show the Ollama environment variables used")
        .action(async (options) => await confEnv());
    const memCmd = program.command("mem")
        .description("show a chart of gpu memory used by models")
        .action(async (options) => modelsMemChart(await ollamaPsOrQuit()));;
    stateOptions.forEach(o => memCmd.addOption(o));
    const unloadCmd = program.command("unload").alias("u")
        .description("unload a model from memory")
        .action(async (options) => await unload(await ollamaPsOrQuit()));
    stateOptions.forEach(o => unloadCmd.addOption(o));
    const modelsCmd = program.command("models").alias("m")
        .description("show a list of models, optional keyword filters")
        .argument("[filters...]", "filter model names: ex 'olm -m qwen mistral'")
        .action(async (filters) => await models(filters));
    stateOptions.forEach(o => modelsCmd.addOption(o));
    const loadCmd = program.command("load").alias("l")
        .description("load a model in memory, optional keywords filters")
        .argument("[filters...]", "filter model names: ex 'olm -m qwen mistral'")
        .action(async (filters, options) => await load(filters, options));
    loadOptions.forEach(o => loadCmd.addOption(o));
    const ggufCmd = program.command("gguf").alias("g")
        .description("provides gguf files info")
        .action(async (options) => await gguf(options));
    ggufOptions.forEach(o => ggufCmd.addOption(o));
    const statsCmd = program.command("info", { isDefault: true })
        .description("show gpu usage statistics")
        .action(async (options) => await mainCmd(options));
    baseOptions.forEach(o => statsCmd.addOption(o));
}

export {
    initCommands
};
