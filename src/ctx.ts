import { checkbox, expand } from '@inquirer/prompts';
import { ModelResponse } from 'ollama';
import ora from 'ora';
import { ps } from './lib/ps.js';
import { ollama } from './state.js';

const ctxChoices = [
    {
        key: '0',
        name: "None (default): use Ollama's server value",
        value: null,
    },
    {
        key: '1',
        name: '2k',
        value: 2048,
    },
    {
        key: '2',
        name: '4k',
        value: 4096,
    },
    {
        key: '3',
        name: '8k',
        value: 8192,
    },
    {
        key: '4',
        name: '16k',
        value: 16384,
    },
    {
        key: '5',
        name: '32k',
        value: 32768,
    },
    {
        key: '6',
        name: '64k',
        value: 65536,
    },
    {
        key: '7',
        name: '128k',
        value: 131072,
    },
]

async function selectModelCtx(): Promise<number> {
    try {
        //@ts-ignore
        return await expand<number>({ message: "Select a context window size", choices: ctxChoices, default: "3", expanded: true });
    } catch (e: any) {
        if (e?.name == "ExitPromptError") {
            process.exit(0)
        }
        throw new Error(e)
    }
}

function parseModelCtx(val: string): { isValid: boolean; value: number | null } {
    let parseChoice = false;
    let choiceUnit = val;
    if (val.includes("K")) {
        choiceUnit = val.replace("K", "k");
        parseChoice = true;
    } else if (val.includes("k")) {
        parseChoice = true;
    }
    if (parseChoice) {
        //console.log("find choice", choiceUnit);
        const choice = ctxChoices.find(c => c.name == choiceUnit);
        if (!choice) {
            return { isValid: false, value: NaN }
        }
        return { isValid: true, value: choice.value }
    }
    else {
        const n = parseInt(val);
        if (isNaN(n)) {
            return { isValid: false, value: NaN }
        }
        return { isValid: true, value: n }
    }
}

async function setCtx(loadedModels: Array<ModelResponse>) {
    const runningModels = loadedModels.map(m => m.model);
    const choices: Array<{ name: string, value: string }> = [];
    runningModels.forEach((m) => {
        choices.push({
            name: m,
            value: m,
        })
    });
    const answer = await checkbox({
        message: 'Select models',
        choices: choices,
    });
    if (answer.length > 0) {
        for (const m of answer) {
            //@ts-ignore
            const val = await selectModelCtx();
            const spinner = ora('Setting context window for ' + m).start();
            // @ts-ignore
            await ollama.generate({ prompt: "", model: m, options: { num_predict: 1, num_ctx: parseInt(val) } });
            //console.log("r", res);
            spinner.stopAndPersist({ text: `Context window set to ${val} for ${m}`, symbol: "" });
        }
        //console.log(`Unloaded ${answer.length} model${answer.length > 1 ? 's' : ''}`);
        await new Promise(resolve => setTimeout(resolve, 250));
        await ps();
    } else {
        console.log("No models selected")
    }
}

export {
    selectModelCtx,
    setCtx,
    parseModelCtx,
};
