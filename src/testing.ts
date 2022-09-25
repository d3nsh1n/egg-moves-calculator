import { getBreedingPaths } from "./Breed Calculation/breed_calculator";
import { ParentInfo } from "./lib";
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
export const sortedParentsInfo2: ParentInfo[] = [
    {
        parent: "par1",
        amount: 1,
        inMoves: ["A"],
        notInMoves: ["B", "C", "D"],
    },
    {
        parent: "par2",
        amount: 1,
        inMoves: ["B"],
        notInMoves: ["A", "C", "D"],
    },
    {
        parent: "par2b",
        amount: 1,
        inMoves: ["B"],
        notInMoves: ["A", "C", "D"],
    },
    {
        parent: "par3",
        amount: 1,
        inMoves: ["C"],
        notInMoves: ["B", "A", "D"],
    },
    {
        parent: "par4",
        amount: 1,
        inMoves: ["D"],
        notInMoves: ["B", "C", "A"],
    },
];
