import { BreedingPath, MoveParents, ParentInfo, SuggestedMove } from "../lib/lib";
import { MoveUsage } from "../smogon-data-collection/smogonlib";
import { getMoveUsage } from "../smogon-data-collection/smogon_stats";
import chalk from "chalk";
import is from "@sindresorhus/is";
import { performance } from "perf_hooks";
import { toPixelmonMove, toPixelmonName } from "../smogon-data-collection/smogonutils";
import { getMoveParents } from "../pixelmon-data-manager/pixelmonutils";
import { DataManager } from "../pixelmon-data-manager/_data_manager";
import { Logger } from "../lib/logger";

const { log, warn, error } = new Logger(true, "BreedCalc", "#99aa22");

export async function suggestMoves(fullName: string, amount?: number, forceInclude: string[] = []): Promise<SuggestedMove[]> {
    //? You need to compare the MoveUsage of the Final Evo, to the learnset/inheritance of the basic form
    // Convert the name into the pixelmon convention (regional names, add default form if needed)
    const finalEvoFullName = toPixelmonName(fullName);
    const finalEvo = DataManager.PokemonRegistry.get(finalEvoFullName);
    const basicForm = finalEvo.getBasic();

    // Guard
    if (is.undefined(DataManager.PokemonRegistry.get(basicForm.toString(), true))) {
        log(chalk.bgRed(`[ERR!] No data found for ${basicForm.toString()}.`));
        return [];
    }
    const eggMoves = Array.from(basicForm.getMovesLearnInfo("eggMoves").keys());

    //? Grab info for all moves, sort/filter (to 4 or more) before returning
    const suggestedMoves: SuggestedMove[] = [];

    //todo move this on parent function call and pass it as argument here - same level code in funcs
    // Get usage stats for the Pokemon's moves (Should be the final evolution in my use cases)
    const moveUsage: MoveUsage = toPixelmonMove(await getMoveUsage(fullName)) as MoveUsage;

    // Add forced moves
    for (const forcedMove of forceInclude) {
        if (!moveUsage.hasOwnProperty(forcedMove)) moveUsage[forcedMove] = 0;
    }

    for (const usedMove in moveUsage) {
        // Guard
        if (!DataManager.MoveRegistry.getPokemonMoves(basicForm.toString())?.hasOwnProperty(usedMove)) {
            warn(`Basic form cannot learn: ${usedMove}`);
            const fullNameMoveInf = DataManager.MoveRegistry.getPokemonMoves(fullName)?.[usedMove];
            if (fullNameMoveInf) {
                log(fullNameMoveInf.learnMethods);
            } else {
                log(chalk.yellow(`Could not find acquisition data for move: ${usedMove}/${fullName}!`));
            }
            continue;
        }

        // Only suggest moves that can be bred on the Pokemon
        if (!basicForm.canInherit(usedMove)) {
            continue;
        }

        // Get learn Info
        const learnMethodInfo = DataManager.MoveRegistry.getPokemonMoves(basicForm.toString())?.[usedMove]!;
        const learnMethods = learnMethodInfo?.learnMethods!;
        const parents: MoveParents = getMoveParents(learnMethodInfo?.parents || [], usedMove);

        // Egg Move Guard
        if (eggMoves?.includes(usedMove) && !parents) {
            error(`[ERR!] Could not find parents for Egg Move ${usedMove} for ${basicForm.toString()}`);
            continue;
        }

        // Build final
        const suggestedMove: SuggestedMove = { move: usedMove, usage: moveUsage[usedMove], learnMethods };
        if (learnMethods.includes("levelUpMoves")) suggestedMove.level = learnMethodInfo.level;
        if (!is.emptyObject(parents)) suggestedMove.parents = parents;

        // Remove move from eggMoves to have a clean list of skipped ones
        if (eggMoves.includes(usedMove)) eggMoves.splice(eggMoves.indexOf(usedMove, 0), 1);

        // Push final
        suggestedMoves.push(suggestedMove);
    }

    log(chalk.bgGreen("[INFO] Egg Moves not included:"));
    suggestedMoves.sort(_sortSuggested);
    const end = amount || suggestMoves.length;
    log(
        "Final:",
        suggestedMoves.slice(0, end).map((m) => {
            return { [m.move]: m.learnMethods };
        })
    );
    return suggestedMoves.slice(0, end);
}

function _sortSuggested(a: SuggestedMove, b: SuggestedMove): number {
    const aIsEgg = a.learnMethods.includes("eggMoves");
    const bIsEgg = b.learnMethods.includes("eggMoves");

    // Egg moves get priority over usage. If one is not an EM, the other goes first.
    // If both are EMs, sort by usage.
    if (aIsEgg && bIsEgg) {
        if (a.usage > b.usage) {
            return -1;
        } else if (a.usage < b.usage) {
            return 1;
        } else {
            return 0;
        }
    } else if (aIsEgg) {
        return -1;
    } else if (bIsEgg) {
        return 1;
    }
    return 0;
}
