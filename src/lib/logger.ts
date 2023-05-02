import chalk from "chalk";

export class Logger {
    constructor(private show: boolean, private context: string, private color: string = "#FFFFFF") {}

    public log = (...data: any) => unboundLog(console.log, this.show, this.context, this.color, ...data);
    public warn = (...data: any) => unboundLog(console.warn, this.show, this.context, this.color, ...data);
    public error = (...data: any) => unboundLog(console.error, this.show, this.context, this.color, ...data);
}

// Chalk
const error = chalk.red;
const warn = chalk.yellow;
function unboundLog(logFunc: (...arg: any[]) => void, show: boolean, context: string, color: string, ...data: any) {
    if (show) {
        const isBrowser = typeof process === "undefined";
        if (isBrowser) {
            logFunc(`%c[${context}] -`, `color: ${color}`, ...data);
        } else {
            if (logFunc === console.warn) {
                logFunc(chalk.hex(color)(`[${context}] -`), warn(...data));
            } else if (logFunc === console.error) {
                logFunc(chalk.hex(color)(`[${context}] -`), error(...data));
            } else {
                logFunc(chalk.hex(color)(`[${context}] -`), ...data);
                // logFunc(`[${context}] -`, ...data);
            }
        }
    }
}
