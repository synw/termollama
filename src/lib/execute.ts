import { spawn } from "child_process";

async function execute(
    command: string,
    args: Array<string> = [],
    {
        onStdout = (data: any): void => { },
        onStderr = (data: any): void => { },
        onError = (data: any): void => { },
        stream = false,
    } = {
            onStderr: (data) => console.log("stderr:", data),
            onError: (err) => { if (err) throw err },
        },
): Promise<string> {
    let buffer = new Array<string>();
    //console.log("Cmd args:", args)
    const child = spawn(command, args, { shell: false });
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (data: any) => {
        buffer.push(data);
        onStdout(data)
    });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (data: any) => onStderr(data));
    child.on("error", (data: any) => onError(data));
    let finish: (value: unknown) => void;
    let end = new Promise((r) => finish = r);
    child.on('close', () => finish(true));
    await end
    if (!stream) {
        return buffer.join("\n")
    } else {
        return buffer.join("")
    }
}

export { execute }
