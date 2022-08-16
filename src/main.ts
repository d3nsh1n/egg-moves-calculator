import fs, { move } from "fs-extra";
import { DataLib } from "./tools/dataLib";
import "./tools/dataLoader";
import { DataLoader } from "./tools/dataLoader";
import chalk from "chalk";
import { getMoveUsage, getPokemonUsage } from "./smogon_stats";
import { getBreedingPaths, getMinimumParents, getParentsInfo, suggestMoves } from "./breed_calculator";
import { ParentInfo } from "./lib/lib";

// const filePath = "data/species/092_gastly.json";
const filePath = "data/species/092_gastly.json";

export async function main() {
    new DataLoader();
    const m = ["A", "B", "C", "D"];
    const sortedParentsInfo: ParentInfo[] = [
        {
            parent: "par1",
            amount: 3,
            inMoves: ["A", "B", "C"],
            notInMoves: ["D"],
        },
        {
            parent: "par2",
            amount: 3,
            inMoves: ["A", "D", "C"],
            notInMoves: ["B"],
        },
        {
            parent: "par3",
            amount: 1,
            inMoves: ["D"],
            notInMoves: ["A", "B", "C"],
        },
    ];
    const paths = getBreedingPaths(sortedParentsInfo);
    console.log(chalk.bgRed("RESULT"));
    console.log(paths);

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
