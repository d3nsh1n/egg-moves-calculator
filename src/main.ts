import "./lib/_extensions";
import fs from "fs-extra";
import "./pixelmon-data-manager/_data_manager";
import { DataManager } from "./pixelmon-data-manager/_data_manager";
import chalk from "chalk";
import { getMoveUsage, getUsageStats } from "./smogon-data-collection/smogon_stats";
import { suggestMoves } from "./breed-calculation/move_suggestion";
import { ParentInfo, SuggestedMove } from "./lib/lib";
import { compressPaths, getBreedingPaths, toParentInfo } from "./breed-calculation/paths";
import { sortedParentsInfo2 } from "./lib/testing";
import { Logger } from "./lib/logger";
import { MoveKeys } from "./pixelmon-data-manager/pixelmonlib";

const { log, warn, error } = new Logger(true, "Main", "#1234FF");

// const filePath = "data/species/092_gastly.json";
const filePath = "data/species/092_gastly.json";

export async function main() {
    log("Running new version.");
    log("ultra before suggest");
    new DataManager(true, true);
    log("before suggest");
    const moves: SuggestedMove[] = await suggestMoves("Turtonator", 3, ["Head Smash", "Curse", "Rapid Spin"]);
    log("asft suggest");
    const info = toParentInfo(moves);
    // console.log({ info });
    const x = getBreedingPaths(info);
    // console.log({ x });
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

class ParentA {
    getA(): ParentB {
        return new ParentB();
    }
}
class ParentB {}

class ChildA extends ParentA {
    override getA(): ChildB {
        return new ChildB();
    }
}

class ChildB extends ParentB {}
