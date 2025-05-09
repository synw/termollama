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
import { models } from './models.js';
import { setCtx } from './ctx.js';

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
    let searchAction: "models" | "load" = "load";
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
                case "-m":
                    cmd = "models";
                    break;
                case "-u":
                    cmd = "unload";
                    break;
                case "-mem":
                    cmd = "mem";
                    break;
                case "-ctx":
                    cmd = "ctx";
                    break;
                case "-k":
                    cmd = "keepAlive";
                    break;
                default:
                    //console.log("PCM", cmd);
                    if (cmd == "serve") { break }
                    else if (cmd == "models") {
                        searchAction = "models";
                        break;
                    } else if (cmd == "load") {
                        searchAction = "load";
                        break;
                    }
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
            const rml = await ollamaPsOrQuit();
            modelsMemChart(rml);
            break;
        case "models":
            await models(args);
            break;
        case "ctx":
            await setCtx();
            break;
        case "load":
            await load(args);
            //await processAction();
            break;
        case "unload":
            const rml1 = await ollamaPsOrQuit();
            await unload(rml1);
            break;
        case "search":
            if (!searchAction) {
                throw new Error("no search action")
            }
            if (searchAction == "load") {
                await load(args);
            } else {
                await models(args);
            }
            break;
        case "keepAlive":
            const rml2 = await ollamaPsOrQuit();
            await keepAlive(rml2);
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
            const rml = await ollamaPsOrQuit()
            await keepAlive(rml);
            break;
        case "u":
            const rml1 = await ollamaPsOrQuit()
            await unload(rml1);
            break
        case "c":
            await setCtx()
            break
        case "m":
            const rml2 = await ollamaPsOrQuit();
            modelsMemChart(rml2);
            await processAction();
            break
        default:
            process.exit(0)
    }
}

(async () => {
    await main();
})();