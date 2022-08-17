import fs from "fs-extra";
import { DataLib } from "./tools/dataLib";
import "./tools/dataLoader";
import { DataLoader } from "./tools/dataLoader";
import chalk from "chalk";
import { getMoveUsage, getPokemonUsage } from "./smogon_stats";
import { getBreedingPaths, getMinimumParents, getParentsInfo, suggestMoves } from "./breed_calculator";
import { ParentInfo } from "./lib/lib";
import { getBasic, getSpeciesForm } from "./lib/utils";
import { sortedParentsInfo2 } from "./testing";

// const filePath = "data/species/092_gastly.json";
const filePath = "data/species/092_gastly.json";

export async function main() {
    new DataLoader();

    const moves = await suggestMoves("Ferrothorn", 4);
    console.log(moves);
    const paths = getMinimumParents(moves, true);
    // const parentInfoSorted: ParentInfo[] = sortedParentsInfo2;
    // const paths = getBreedingPaths(parentInfoSorted);
    console.log(chalk.bgRed.black("FINAL RESULT"));
    writeToTest(paths);
}

export function writeToTest(data: any) {
    fs.writeFileSync("data/out/test.json", JSON.stringify(data, null, 4));
}

main();
