#!/usr/bin/env node
import { argv } from 'process';
import { serve } from './serve.js';
import { ps } from './ps.js';
import { search } from './search.js';
import { memStats, memTotalStats, modelsMemChart } from './lib/stats.js';
import { getGPUMemoryInfo } from './lib/gpu.js';
import { confEnv } from "./env.js";
import { Cmd } from './interfaces.js';
import { load } from './load.js';
import { actionBar } from './actionbar.js';
import { unload } from './unload.js';
import { gpus, initState, ollama } from './state.js';
import { keepAlive } from './keepalive.js';
import { ListResponse } from 'ollama/dist';
import { valueOptions } from './lib/options.js';

async function ollamaPsOrQuit(): Promise<ListResponse> {
    const ps = await ollama.ps();
    if (ps.models.length == 0) {
        console.log("No models are loaded in memory")
        process.exit(0)
    }
    return ps
}

async function main(useDefault = false) {
    let args = new Array<string>();
    const searchArgs = new Array<string>();
    let cmd: Cmd = "default";
    if (argv.length > 2) {
        args.push(...argv.slice(2));
    }
    //console.log("ARGS", args);
    //const serverArgs = new Array<string>();
    const genArgs: Record<string, any> = {
        "-p": "port",
        "-gpu": "gpu",
    };
    let port = 11434;
    let nextArgIsValFor: string | null = null;
    if (!useDefault) {
        for (const a of args) {
            if (nextArgIsValFor) {
                //console.log("NA", a);
                switch (nextArgIsValFor) {
                    case "port":
                        port = Number(a)
                        break;
                    case "gpu":
                        gpus.push(...a.split(",").map((x) => Number(x)));
                        //console.log("GPUS", gpus);
                        break;
                }
                nextArgIsValFor = null;
                continue
            }
            if (Object.keys(genArgs).includes(a)) {
                nextArgIsValFor = genArgs[a];
                continue
            }
            switch (a) {
                case "-x":
                    cmd = "serve";
                    break;
                case "-env":
                    cmd = "env";
                    break;
                case "-l":
                    cmd = "load";
                    break;
                case "-u":
                    cmd = "unload";
                    break;
                case "-mem":
                    cmd = "mem";
                    break;
                case "-k":
                    cmd = "keepAlive";
                    break;
                default:
                    if (cmd == "serve") { break }
                    if (a.startsWith("-")) {
                        console.error(`unknown flag ${a}`);
                        return;
                    }
                    //console.log("SA", a);
                    searchArgs.push(a);
                    cmd = "search";
                    break;
            }
        }
    }
    initState(port);
    //console.log("CMD", cmd);
    switch (cmd) {
        case "serve":
            await serve(args);
            break;
        case "env":
            await confEnv();
            break;
        case "mem":
            modelsMemChart(await ollamaPsOrQuit());
            break;
        case "load":
            await load(args);
            break;
        case "unload":
            await ollamaPsOrQuit();
            await unload();
            break;
        case "search":
            await load(args);
            break;
        case "keepAlive":
            await ollamaPsOrQuit();
            await keepAlive();
            break;
        case "default":
            const info = getGPUMemoryInfo();
            if (info.cards.length > 1) {
                memStats(info);
            }
            await ps(false);
            memTotalStats(info);
            if (!useDefault) {
                await processAction();
            }
            break
        default:
            await search(searchArgs);
            break;
    }
}

async function processAction() {
    const k = await actionBar();
    //console.log("K", k);
    switch (k) {
        case "l":
            await load();
            //await main([])
            break;
        case "k":
            await ollamaPsOrQuit()
            await keepAlive();
            break;
        case "u":
            await ollamaPsOrQuit()
            await unload();
            break
        /*case "i":
            await main([])
            break*/
        case "m":
            modelsMemChart(await ollamaPsOrQuit());
            await processAction();
            break
        default:
            process.exit(0)
    }
}

(async () => {
    await main();
})();