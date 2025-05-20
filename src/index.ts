#!/usr/bin/env node
import { Command } from "@commander-js/extra-typings";
import { initCommands } from "./cmds.js";
import { initEnvVars, initOllamaInstanceState } from "./state.js";
import { StateOptions } from "./interfaces.js";

(async () => {
    const program = new Command();
    program.hook('preAction', (thisCommand, actionCommand) => {
        const cmdName = thisCommand.name();
        if (!["serve", "gguf"].includes(cmdName)) {
            const opts = actionCommand.opts() as StateOptions;
            initOllamaInstanceState(opts?.useInstance, opts?.useHttps);
        } else if (cmdName == "info") {
            initEnvVars()
        }
    });
    initCommands(program);
    await program.parseAsync();
})();
