import fs from "fs-extra";
import { DataLib } from "./tools/dataLib";
import "./tools/dataLoader";
import { DataLoader } from "./tools/dataLoader";
import chalk from "chalk";
import { getMoveUsage, getPokemonUsage } from "./Smogon Data Collection/smogon_stats";
import { getMinimumParents, getParentsInfo, suggestMoves } from "./breed_calculator";
import { ParentInfo } from "./lib/lib";
import { getBasic, getSpeciesForm, isSameEvoLine, unboundLog, warn } from "./lib/utils";
import { compressPaths, getBreedingPaths } from "./path_generator";
import { sortedParentsInfo2 } from "./testing";

const __CONTEXT__ = "Main";
const LOG = true;
const log = (...data: any) => unboundLog(LOG, __CONTEXT__, "#1234FF", ...data);

// const filePath = "data/species/092_gastly.json";
const filePath = "data/species/092_gastly.json";

export async function main() {
    new DataLoader(true);

    const moves = await suggestMoves("Rillaboom", 4, ["Hammer Arm", "Growth", "Leech Seed"]);
    const info = getParentsInfo(moves);
    const x = getBreedingPaths(info);
    compressPaths(x);
    // debug(x);
    writeToTest(x);
}

export function writeToTest(data: any) {
    fs.writeFileSync("data/out/test.json", JSON.stringify(data, null, 4));
}

main();

//todo Add tmMoves7 back to MOVE_KEYS, so that Ferrothorn gets Toxic by it, rather than EMs.
//todo Then, use that as an example, to make moves that are EM + Other help with parent selection.
//todo For example, if you have to choose between Bulbasaur and X for Egg Move Leech Seed, choose Bulbasaur due to Toxic, even if Toxic's best
//todo way of obtaining isn't EMs

//todo fix for manually adding Cyndaquil to Typhlosion-H, Obstagoon, MrRime, Ursaluna
