import ky from "ky-universal";
import chalk from "chalk";
import { MoveUsage, toSmogonName, UsageMoves, UsageStats } from "./lib/smogonlib";
import { writeToTest } from "./main";
import fs from "fs-extra";

export async function getPokemonUsage(fullName: string) {
    const usageStats = await ky.get(`https://smogon-usage-stats.herokuapp.com/2022/07/gen8nationaldex/0/${fullName}`).json();
    console.log(usageStats);
    writeToTest(usageStats);
    return usageStats;
}

export async function getMoveUsage(fullName: string): Promise<MoveUsage> {
    const smogonName = toSmogonName(fullName);
    try {
        const usageStats: UsageStats = (await getPokemonUsage(smogonName)) as UsageStats;
        const final: MoveUsage = {};
        for (const move in usageStats.moves) {
            final[move] = parseFloat(usageStats.moves[move].replace("%", ""));
        }
        return final;
    } catch (err: any) {
        console.log(chalk.bgYellow("Could not fetch data for", fullName));
        console.log(chalk.yellow(err));
        return {};
    }
}

//! LOCAL OFFLINE
export async function getMoveUsage2(fullName: string): Promise<MoveUsage> {
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
        console.log(chalk.bgYellow("Could not fetch data for", fullName));
        console.log(chalk.yellow(err));
        return {};
    }
}
