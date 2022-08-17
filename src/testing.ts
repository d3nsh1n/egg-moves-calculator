import { getBreedingPaths } from "./breed_calculator";
import { ParentInfo } from "./lib/lib";
import chalk from "chalk";

const m = ["A", "B", "C", "D"];
const sortedParentsInfo: ParentInfo[] = [
    {
        parent: "par1",
        amount: 3,
        inMoves: ["A", "B", "C"],
        notInMoves: ["D", "E"],
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
    {
        parent: "par4",
        amount: 1,
        inMoves: ["D", "B"],
        notInMoves: ["A", "C"],
    },
];
const paths = getBreedingPaths(sortedParentsInfo);
console.log(chalk.bgRed("RESULT"));
console.log(paths);
