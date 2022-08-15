import fs, { move } from "fs-extra";
import { DataLib } from "./tools/dataLib";
import "./tools/dataLoader";
import { DataLoader } from "./tools/dataLoader";
import chalk from "chalk";
import { getMoveUsage, getPokemonUsage } from "./smogon_stats";
import { getMinimumParents, getParentsInfo, suggestMoves } from "./breed_calculator";

// const filePath = "data/species/092_gastly.json";
const filePath = "data/species/092_gastly.json";

export async function main() {
    new DataLoader();
    console.log(DataLib.getDefaultForm("Mimikyu").name);
    console.log(DataLib.isSameEvoLine("Jolteon", "Wobbuffet"));

    return;
    const moves = await suggestMoves("Cofagrigus");
    writeToTest(moves);
    // console.log(DataLib.INHERITABLE_MOVES["Mimikyu-disguised"]);

    const min = getMinimumParents(moves);
    console.log(chalk.blue("Min parents:"));
    console.log(min);
}

export function writeToTest(data: any) {
    fs.writeFileSync("data/test.json", JSON.stringify(data, null, 4));
}

main();
