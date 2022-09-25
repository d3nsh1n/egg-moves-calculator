import chalk from "chalk";

// Chalk
export const error = chalk.red;
export const warn = chalk.yellow;

export function unboundLog(show: boolean, context: string, color: string, ...data: any) {
    if (show) {
        const isBrowser = process.title === "browser";
        if (isBrowser) {
            console.log(`%c[${context}] -`, `color: ${color}`, ...data);
        } else {
            console.log(chalk.hex(color)(`[${context}] -`), ...data);
        }
    }
}
