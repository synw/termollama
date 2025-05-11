#!/usr/bin/env node
import { Command } from "@commander-js/extra-typings";
import { initCommands } from "./cmds.js";
import { initState } from "./state.js";
import { StateOptions } from "./interfaces.js";

(async () => {
    const program = new Command();
    program.hook('preAction', (thisCommand, actionCommand) => {
        if (thisCommand.name() != "serve") {
            const opts = actionCommand.opts() as StateOptions;
            initState(opts?.useInstance, opts?.useHttps);
        }
    });
    initCommands(program);
    await program.parseAsync();
})();
