import chalk from "chalk";

export class myLogger {
    public red(...args: any) {
        console.log(chalk.red(args));
    }
}

export const logger = new myLogger();
