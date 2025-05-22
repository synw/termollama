#!/usr/bin/env node
import { Command } from "commander";
import { initCommands } from "./cmds.js";
import { initEnvVars, initMemoryState, initOllamaInstanceState } from "./state.js";

(async () => {
    const program = new Command();
    program.hook('preAction', (thisCommand, actionCommand) => {
        const cmdName = actionCommand.name();
        const options = actionCommand.opts();
        if (!["serve", "gguf"].includes(cmdName)) {
            initOllamaInstanceState(options?.useInstance, options?.useHttps);
        }
        if (cmdName == "info") {
            initEnvVars();
        }
        if (["info", "load", "models"].includes(cmdName)) {
            let gpusToUse: Array<number> | undefined = options?.gpu;
            initMemoryState(options?.cpu, gpusToUse)
        }
    });
    initCommands(program);
    await program.parseAsync();
})();
