import fs from "fs-extra";
import "./Pixelmon Data Manager/data_manager";
import { DataManager } from "./Pixelmon Data Manager/data_manager";
import chalk from "chalk";
import { getMoveUsage, getUsageStats } from "./Smogon Data Collection/smogon_stats";
import { getParentsInfo, suggestMoves } from "./Breed Calculation/breed_calculator";
import { ParentInfo } from "./lib";
import { compressPaths, getBreedingPaths } from "./Breed Calculation/path_generator";
import { sortedParentsInfo2 } from "./testing";
import { unboundLog } from "./logger";

const __CONTEXT__ = "Main";
const LOG = true;
const log = (...data: any) => unboundLog(LOG, __CONTEXT__, "#1234FF", ...data);

// const filePath = "data/species/092_gastly.json";
const filePath = "data/species/092_gastly.json";

export async function main() {
    log("Running new version.");
    new DataManager(true);

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
