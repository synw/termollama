import { checkbox, input } from '@inquirer/prompts';
import { ModelResponse } from 'ollama';
import { ps } from './lib/ps.js';
import { ollama } from './state.js';

async function selectFromRunningModels(models: Array<ModelResponse>): Promise<Array<string>> {
    const runningModels = models.map(m => m.model);
    const choices: Array<{ name: string, value: string }> = [];
    runningModels.forEach((m) => {
        choices.push({
            name: m,
            value: m,
        })
    });
    let answer: Array<string>;
    try {
        answer = await checkbox({
            message: 'Select models',
            choices: choices,
        });
    } catch (e: any) {
        //console.log(typeof e, JSON.stringify(e))
        if (e?.name == "ExitPromptError") {
            process.exit(0)
        }
        throw new Error(e)
    }
    return answer
}

async function selectKeepAlive(m: string): Promise<string> {
    let val: string;
    try {
        val = await input({ message: `Keep alive ${m}:` });
    } catch (e: any) {
        //console.log(typeof e, JSON.stringify(e))
        if (e?.name == "ExitPromptError") {
            process.exit(0)
        }
        throw new Error(e)
    }
    return val
}

async function keepAlive(models: Array<ModelResponse>) {
    const answer = await selectFromRunningModels(models);
    if (answer.length > 0) {
        for (const m of answer) {
            const val = await selectKeepAlive(m);
            console.log(" Setting keep alive to", val, "for", m);
            // @ts-ignore
            await ollama.generate({ prompt: "", model: m, keep_alive: val, options: { num_predict: 1 } });
            //console.log("r", res);
        }
        //console.log(`Unloaded ${answer.length} model${answer.length > 1 ? 's' : ''}`);
        await new Promise(resolve => setTimeout(resolve, 250));
        await ps();
    } else {
        console.log("No models selected")
    }
}

export {
    keepAlive,
    selectFromRunningModels,
    selectKeepAlive,
};
