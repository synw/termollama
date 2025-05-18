import { checkbox } from '@inquirer/prompts';
import ora from 'ora';
import { parseModelCtx, selectModelCtx } from './ctx.js';
import { getGPUMemoryInfo, gpuTotalStats } from "./lib/bars/gpus.js";
import { modelsMemChart } from './lib/models.js';
import { ollama } from './state.js';
import { ollamaPs } from './lib/ps.js';
import { runtimeParamError } from './lib/user_msgs.js';
import { selectKeepAlive } from './keepalive.js';
import { GenerateRequest, Options } from 'ollama/dist/index.js';

async function load(filters: Array<string>, options: Record<string, any>) {
    const { isRunning, models } = await ollamaPs();
    if (!isRunning) {
        console.warn("No instance of Ollama is running");
        return
    }
    const res = await ollama.list();
    //console.log("FILTERS", filters);
    const runningModels = models.map(m => m.model);
    let rawData = res.models.sort((a, b) => a.size - b.size).map(m => m.model);
    const data = new Array<string>();
    rawData.forEach((row) => {
        if (!runningModels.includes(row)) {
            data.push(row)
        }
    });
    const filteredChoices: Array<{ name: string, value: string }> = [];
    const allModelsChoices: Array<{ name: string, value: string }> = [];
    data.forEach(m => {
        const c = {
            name: m,
            value: m,
        };
        allModelsChoices.push(c);
        if (filters.every(f => m.includes(f))) {
            filteredChoices.push(c)
        }
    });
    let choices = allModelsChoices;
    if (filters.length > 0) {
        if (filteredChoices.length == 0) {
            console.warn("No models found matching query", filters.join(" "));
        } else {
            choices = filteredChoices
        }
    }
    let answer: Array<string>;
    try {
        answer = await checkbox({
            message: 'Load models?',
            choices: choices,
            pageSize: 10,
            //loop: false,
        });
    } catch (e: any) {
        if (e?.name == "ExitPromptError") {
            process.exit(0)
        }
        throw new Error(e)
    }
    if (answer.length > 0) {
        for (const m of answer) {
            let selectedCtx: number | null = null;
            let selectedKeepAlive: string | null = null;
            // ctx option
            switch (options?.ctx) {
                case undefined:
                    selectedCtx = await selectModelCtx();
                    break;
                default:
                    const { isValid, value } = parseModelCtx(options.ctx);
                    if (!isValid) {
                        runtimeParamError("Invalid value", options.ctx, "for ctx");
                    }
                    selectedCtx = value;
                    break;
            }
            // keep alive option
            switch (options?.keepAlive) {
                case undefined:
                    selectedKeepAlive = await selectKeepAlive(m)
                    break;
                default:
                    selectedKeepAlive = options.keepAlive;
                    break;
            }
            const opts: Record<string, any> = { num_predict: 1 };
            let ka: Record<string, any> = {};
            if (selectedCtx) {
                opts.num_ctx = selectedCtx
            }
            if (selectedKeepAlive) {
                ka.keep_alive = selectedKeepAlive
            }
            const payload: GenerateRequest = {
                prompt: "", model: m, ...ka, options: opts
            };
            const spinner = ora('Loading ' + m).start();
            await ollama.generate({ ...payload, stream: true });
            //console.log("Loaded", m)
            spinner.stopAndPersist({ text: m, symbol: "+" });
        }
        //console.log(`Loaded ${answer.length} model${answer.length > 1 ? 's' : ''}`)
        const ps = await ollamaPs();
        modelsMemChart(ps.models);
        const { hasGPU, info } = getGPUMemoryInfo();
        if (hasGPU) {
            gpuTotalStats(info)
        }
    } else {
        console.warn("No model loaded")
    }
}

export { load };
