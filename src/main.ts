import fs, { move } from "fs-extra";
import { DataLib } from "./tools/dataLib";
import "./tools/dataLoader";
import { DataLoader } from "./tools/dataLoader";
import chalk from "chalk";
import { getMoveUsage, getPokemonUsage } from "./smogon_stats";
import { suggestMoves } from "./breed_calculator";

// const filePath = "data/species/092_gastly.json";
const filePath = "data/species/092_gastly.json";

export async function main() {
    new DataLib();
    new DataLoader(true);

    // const moves = await suggestMoves("Swellow");
    // writeToTest(moves);
}

export function writeToTest(data: any) {
    fs.writeFileSync("data/test.json", JSON.stringify(data, null, 4));
}

main();
