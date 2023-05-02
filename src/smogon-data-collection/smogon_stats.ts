import ky from "ky-universal";
import chalk from "chalk";
import { MoveUsage, UsageMoves, UsageStats } from "./smogonlib";
import { writeToTest } from "../main"; //
import fs from "fs-extra";
import { Logger } from "../lib/logger";
import { toSmogonName } from "./smogonutils";

const { log, warn, error } = new Logger(true, "SmogonStats", "#562122");
export async function getUsageStats(fullName: string): Promise<UsageStats> {
    const usageStats: UsageStats = await ky.get(`https://smogon-usage-stats.herokuapp.com/2022/07/gen8nationaldex/0/${fullName}`).json();
    log(usageStats);
    writeToTest(usageStats);
    return usageStats;
}

export async function getMoveUsage(fullName: string): Promise<MoveUsage> {
    const smogonName = toSmogonName(fullName);
    try {
        const usageStats: UsageStats = (await getUsageStats(smogonName)) as UsageStats;
        const final: MoveUsage = {};
        for (const move in usageStats.moves) {
            final[move] = parseFloat(usageStats.moves[move].replace("%", ""));
        }
        return final;
    } catch (err: any) {
        log(chalk.bgYellow("Could not fetch data for", fullName));
        log(chalk.yellow(err));
        return {};
    }
}

//! LOCAL OFFLINE
export async function getMoveUsageOffline(fullName: string): Promise<MoveUsage> {
    const usage = JSON.parse(fs.readFileSync(`data/usage_stats/${fullName.toLowerCase()}.json`).toString());
    //!
    const smogonName = toSmogonName(fullName);
    try {
        const usageStats: UsageStats = usage as UsageStats;
        const final: MoveUsage = {};
        for (const move in usageStats.moves) {
            final[move] = parseFloat(usageStats.moves[move].replace("%", ""));
        }
        return final;
    } catch (err: any) {
        log(chalk.bgYellow("Could not fetch data for", fullName));
        log(chalk.yellow(err));
        return {};
    }
}
