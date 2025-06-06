import { InvalidArgumentError, Option } from "commander";

const stateOptions: Array<Option> = [
    new Option("-u, --use-instance <hostdomain>", "use a specific Ollama instance as source: 'olm -u 162.168.1.8:11434'"),
    new Option("-s, --use-https", "use an https protocol to reach the Ollama instance. Default: false")
];

const gpuOptions: Array<Option> = [
    new Option("--cpu", "use cpu only").conflicts("gpu"),
    new Option("-g, --gpu <number(s...>", "use given gpus: ex: '0 1'").argParser((v: any, p: any) => {
        const iv = parseInt(v);
        if (isNaN(iv)) {
            throw new InvalidArgumentError(`--gpu option: ${v} is not a number`);
        }
        return p ? [...p, iv] : [iv]
    }),
];

const serveOptions: Array<Option> = [
    new Option("-f, --flash-attention", "use flash attention for faster inference. Default: false"),
    new Option("-4 --kv-4", "use q4 kv cache").implies({ "flashAttention": true }).conflicts("kv8"),
    new Option("-8 --kv-8", "use q8 kv cache").implies({ "flashAttention": true }),
    new Option("-d, --debug", "enable debug mode. Default: false"),
    new Option("-k, --keep-alive <timestring>", "time to keep the server alive after no requests. Example: '1h'"),
    new Option("-c, --ctx <number>", "context size for the models. Default: 2048"),
    new Option("-m, --max-loaded-models <number>", "maximum number of models to load at once."),
    new Option("-q, --max-queue <number>", "maximum number of requests in the queue."),
    new Option("-n, --num-parallel <number>", "number of parallel requests."),
    new Option("--host <hostname>", "hostname to serve the server on. Default: 'localhost'"),
    new Option("-p, --port <number>", "port to serve the server on. Default: '11434'"),
    new Option("-r, --registry <path>", "use a model registry directory"),
    ...gpuOptions,
];

const ggufOptions: Array<Option> = [
    new Option(
        "-m, --model <query...>",
        "show information about a model.\n Use this one of these formats to search for a model: \n olm -m qwen3:0.6b\n olm -m qwen3 0.6b"
    ).conflicts("template").conflicts("exfiltrate"),
    new Option(
        "-t, --template <query...>",
        "show a model's template.\n Use this one of these formats to search for a model: \n olm -m qwen3:0.6b\n olm -m qwen3 0.6b"
    ),
    new Option(
        "-x, --exfiltrate <model_and_destination...>",
        "exfiltrate a model blob to a gguf file.\n Use this one of these formats to search for a model: \n olm -m qwen3:0.6b\n olm -m qwen3 0.6b",
    ).conflicts("template").conflicts("model"),
    new Option(
        "-c, --copy <model_and_destination...>",
        "copy a model blob to a gguf file.\n Use this one of these formats to search for a model: \n olm -m qwen3:0.6b\n olm -m qwen3 0.6b",
    ).conflicts("template").conflicts("model").conflicts("exfiltrate"),
    new Option("-r, --registry <path>", "use a model registry directory"),
];

const baseOptions: Array<Option> = [
    ...stateOptions,
    new Option("-w, --watch", "enable watch mode for real time info. Default: false"),
    new Option(
        "-m, --max-model-bars <number>",
        "set the max loaded models number to use. Default: OLLAMA_MAX_LOADED_MODELS if set or number of gpus * 3 (Ollama's default)" +
        "\nUseful when the server is launched with a custom max models setting and your OLLAMA_MAX_LOADED_MODELS env variable is unset. " +
        "Example: run the server with 'olm s -m 4' and use 'olm -wm 4'. Or just 'olm -wm 1' if you want to see only one model bar.",
    ),
    ...gpuOptions,
]

const loadOptions: Array<Option> = [
    ...stateOptions,
    new Option(
        "-k, --keep-alive <timestring>",
        "set the keep alive time for the model. Default: Ollama server's keep alive time"
    ),
    new Option(
        "-c, --ctx <number_or_unit>",
        "set the model context window value: use a number or a predefined unit:\n2K, 4K, 8K, 16K, 32K, 64K, 128K\nDefault: Ollama server's context window",
    ),
    new Option(
        "-n, --ngl <number>",
        "number of layers to load on the gpu",
    ).argParser((v: any, p: any) => {
        const iv = parseInt(v);
        if (isNaN(iv)) {
            throw new InvalidArgumentError(`--ngl option: ${v} is not a number`);
        }
        return iv
    }),
]

export {
    stateOptions,
    serveOptions,
    ggufOptions,
    baseOptions,
    loadOptions,
}