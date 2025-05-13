import { checkbox } from '@inquirer/prompts';
import ora from 'ora';
import { selectModelCtx } from './ctx.js';
import { getGPUMemoryInfo, systemHasGpu } from './lib/gpu.js';
import { memTotalStats, modelsMemChart } from './lib/stats.js';
import { ollama } from './state.js';
import { ollamaPs } from './ps.js';

async function load(filters: Array<string>) {
    const loadedModels = await ollamaPs();
    const res = await ollama.list();
    //console.log("FILTERS", filters);
    const runningModels = loadedModels.models.map(m => m.model);
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
        for (const f of filters) {
            if (m.includes(f)) {
                filteredChoices.push(c)
                return
            }
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
    const answer = await checkbox({
        message: 'Load models?',
        choices: choices,
        pageSize: 10,
        loop: false,
    });
    if (answer.length > 0) {
        for (const m of answer) {
            const mctx = await selectModelCtx();
            const spinner = ora('Loading ' + m).start();
            await ollama.generate({ prompt: "", model: m, options: { num_predict: 1, num_ctx: parseInt(mctx) } });
            //console.log("Loaded", m)
            spinner.stopAndPersist({ text: m, symbol: "+" });
        }
        //console.log(`Loaded ${answer.length} model${answer.length > 1 ? 's' : ''}`)
        modelsMemChart(await ollamaPs());
        const hasGpu = await systemHasGpu();
        //sconsole.log("has gpu", hasGpu);
        if (hasGpu) {
            memTotalStats(await getGPUMemoryInfo())
        }
    } else {
        console.warn("No model loaded")
    }
}

export { load };
