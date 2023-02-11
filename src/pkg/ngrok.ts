import { readLines } from 'https://deno.land/std@0.125.0/io/mod.ts';
import { TypedCustomEvent, TypedEventTarget } from 'https://deno.land/x/typed_event_target@1.0.1/mod.ts';

type Events = {
    status: Deno.ProcessStatus;
    stdout: string;
    stderr: string;
    ready: string;
};

interface NgrokOptions {
    protocol: string;
    addr: string;
    region?: string;
    subdomain?: string;
    authtoken?: string;
    extraArgs?: string[];
}

export class Ngrok extends TypedEventTarget<Events> {
    private instance: Deno.Process<{
        cmd: [string, ...string[]];
        stdout: 'piped';
        stderr: 'piped';
    }>;

    private constructor(args: string[]) {
        super();

        this.instance = Deno.run({
            cmd: ['ngrok', ...args],
            stdout: 'piped',
            stderr: 'piped',
        });

        this.handleStdout();
        this.handleStderr();
        this.handleStatus();
    }

    static create(options: NgrokOptions) {
        const args: string[] = [];
        args.push(options.protocol, '--log=stdout');
        if (options.region) args.push(`--region=${options.region}`);
        if (options.subdomain) args.push(`--subdomain=${options.subdomain}`);
        if (options.authtoken) args.push(`--authtoken=${options.authtoken}`);
        if (options.extraArgs) args.push(...options.extraArgs);
        args.push(options.addr);

        return new Ngrok(args);
    }

    destroy(signal?: Deno.Signal): Promise<void> {
        this.instance.stdout.close();
        this.instance.stderr.close();
        this.instance.kill(signal || 'SIGTERM');
        this.instance.close();

        return new Promise((resolve) => {
            this.addEventListener('status', () => {
                resolve();
            });
        });
    }

    private async handleStdout() {
        const ready = /started tunnel.*:\/\/(.*)/;
        let readyEventSent = false;

        try {
            for await (const line of readLines(this.instance.stdout)) {
                this.dispatchEvent(new TypedCustomEvent('stdout', { detail: line }));

                if (!readyEventSent) {
                    const isReady = line.match(ready);
                    if (isReady) {
                        readyEventSent = true;
                        this.dispatchEvent(new TypedCustomEvent('ready', { detail: isReady[1] }));
                    }
                }
            }
        } catch {
            // Process killed via destroy()
            return;
        }
    }

    private async handleStderr() {
        try {
            for await (const line of readLines(this.instance.stderr)) {
                this.dispatchEvent(new TypedCustomEvent('stderr', { detail: line }));
            }
        } catch {
            // Process killed via destroy()
            return;
        }
    }

    private async handleStatus() {
        this.dispatchEvent(new TypedCustomEvent('status', { detail: await this.instance.status() }));
    }
}
