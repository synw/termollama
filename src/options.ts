import { InvalidArgumentError, Option } from "@commander-js/extra-typings";

const stateOptions: Array<Option> = [
    new Option("-u, --use-instance <hostdomain>", "use a specific Ollama instance as source: 'olm -u 162.168.1.8:11434'"),
    new Option("-s, --use-https", "use an https protocol to reach the Ollama instance. Default: false")
];

const serveOptions: Array<Option> = [
    new Option("-f, --flash-attention", ""),
    new Option("-4 --kv-4").implies({ "flashAttention": true }).conflicts("kv8"),
    new Option("-8 --kv-8").implies({ "flashAttention": true }),
    new Option("-d, --debug", ""),
    new Option("--cpu", "").conflicts("gpu"),
    new Option("-k, --keep-alive <timestring>", ""),
    new Option("-c, --ctx <number>", ""),
    new Option("-m, --max-loaded-models <number>", ""),
    new Option("-q, --max-queue <number>", ""),
    new Option("-n, --num-parallel <number>", ""),
    new Option("--host <hostname>", ""),
    new Option("-p, --port <number>", ""),
    new Option("-r, --registry <path>", "use a model registry directory"),
    new Option("-g, --gpu <number...>", "").argParser((v: any, p: any) => {
        const iv = parseInt(v);
        if (isNaN(iv)) {
            throw new InvalidArgumentError(`--gpu option: ${v} is not a number`);
        }
        return p ? [...p, iv] : [iv]
    }),
];

const ggufOptions: Array<Option> = [
    new Option(
        "-m, --model <query...>",
        "show information about a model.\n Use this one of these formats to search for a model: \n olm -m qwen3:0.6b\n olm -m qwen3 0.6b"
    ),
    new Option(
        "-t, --template <query...>",
        "show a model's template.\n Use this one of these formats to search for a model: \n olm -m qwen3:0.6b\n olm -m qwen3 0.6b"
    ),
];

export {
    stateOptions,
    serveOptions,
    ggufOptions,
}