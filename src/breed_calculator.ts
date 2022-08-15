import { MoveParents, ParentInfo, SuggestedMove } from "./lib/lib";
import { MoveUsage, toPixelmonMove, toPixelmonName } from "./lib/smogonlib";
import { getMoveUsage } from "./smogon_stats";
import { DataLib } from "./tools/dataLib";
import { DataLoader } from "./tools/dataLoader";
import chalk from "chalk";
import is from "@sindresorhus/is";

export async function suggestMoves(fullName: string) {
    let movesFound = 0;
    const suggestedMoves: SuggestedMove[] = [];

    const moveUsage: MoveUsage = toPixelmonMove(await getMoveUsage(fullName)) as MoveUsage;
    // console.log(chalk.blue("USAGE:"));
    // console.log(moveUsage);
    const formName = DataLib.FORMS.hasOwnProperty(fullName) ? fullName : `${fullName}-${DataLib.getDefaultForm(fullName).name}`;
    if (!DataLib.FORMS.hasOwnProperty(formName)) {
        console.log(chalk.bgRed(`[ERR!] No data found for ${formName}`));
        return [];
    }
    const form = DataLib.FORMS[formName];
    const eggMoves = DataLib.getFormMoves(form, "eggMoves") as string[];

    //* Grab info for all moves, sort later/externally
    for (const usedMove in moveUsage) {
        // Guard
        if (!DataLib.INHERITABLE_MOVES[formName].hasOwnProperty(usedMove)) {
            console.log(chalk.yellow(`Could not find move ${usedMove} - Skipping...`));
            continue;
        }

        // Get learn Info
        const learnMethodInfo = DataLib.INHERITABLE_MOVES[formName][usedMove];
        const learnMethods = learnMethodInfo.learnMethods;
        const parents = learnMethodInfo.parents || {};
        if (learnMethods.includes("levelUpMoves")) parents[fullName] = { learnMethods, level: learnMethodInfo.level };

        // Egg Move Guard
        if (eggMoves?.includes(usedMove) && !parents) {
            console.log(chalk.bgRed(`[ERR!] Could not find parents for Egg Move ${usedMove} for ${formName}`));
            continue;
        }

        // Build final
        const suggestedMove: SuggestedMove = { move: usedMove, usage: moveUsage[usedMove], learnMethods };
        if (!is.emptyObject(parents)) suggestedMove.parents = parents;

        // Not sure why I did that - Possibly useless after refactoring
        delete moveUsage[usedMove];

        // Remove move from eggMoves to have a clean list of skipped ones
        if (eggMoves.includes(usedMove)) eggMoves.splice(eggMoves.indexOf(usedMove, 0), 1);

        // Push final
        suggestedMoves.push(suggestedMove);
    }

    console.log(chalk.bgGreen("[INFO] Egg Moves not included:"));
    console.log(eggMoves);
    return suggestedMoves;
}

export function getMinimumParents(suggestedMoves: SuggestedMove[]) {
    const parentsInfo = getParentsInfo(suggestedMoves);
    const paths: any = {};

    const arbitraryAmount = 3;
    for (let i = 0; i < arbitraryAmount; i++) {
        paths[i] = findCoParent(suggestedMoves, parentsInfo, parentsInfo[i]);
    }

    return paths;
}

export function getParentsInfo(suggestedMoves: SuggestedMove[]) {
    const parentsInfo: ParentInfo[] = [];
    const parentsChecked: string[] = [];

    //* For each suggested move
    for (const suggestedMove of suggestedMoves) {
        //* Iterate not already checked parents
        for (const parent in suggestedMove.parents) {
            if (parentsChecked.includes(parent)) continue;

            const inMoves: string[] = [];
            const notInMoves: string[] = [];
            //* Iterate through each move, and count how many of them include the parent as a source
            for (const move of suggestedMoves) {
                if (Object.keys(move.parents).includes(parent)) {
                    inMoves.push(move.move);
                } else {
                    notInMoves.push(move.move);
                }
            }
            //* Mark as checked
            parentsChecked.push(parent);

            //* Store info
            parentsInfo.push({ parent, amount: inMoves.length, inMoves, notInMoves });
        }
    }
    parentsInfo.sort(sortParentsInfo);
    return parentsInfo;
}

function sortParentsInfo(a: ParentInfo, b: ParentInfo) {
    if (a.amount < b.amount) return 1;
    if (a.amount > b.amount) return -1;
    return 0;
}

export function findCoParent(suggestedMoves: SuggestedMove[], parentsInfo: ParentInfo[], ...parents: ParentInfo[]): ParentInfo[] {
    let coveredMoves: string[] = [];
    let missingMoves: string[] = [];

    for (const providedParent of parents) {
        coveredMoves.push(...providedParent.inMoves);
        missingMoves.push(...providedParent.notInMoves);
    }
    coveredMoves = [...new Set(coveredMoves)];
    missingMoves = [...new Set(missingMoves)].filter((m) => !coveredMoves.includes(m));

    if (missingMoves.length === 0) return parents;

    //* Scan parents for the first one that fulfills one of the missing moves
    for (const parent of parentsInfo) {
        // No need to check existing parents
        if (parents.includes(parent)) continue;
        for (const move of parent.inMoves) {
            if (missingMoves.includes(move)) {
                parents.push(parent);
                // if (parents.length !== 2) return parents;
                return findCoParent(suggestedMoves, parentsInfo, ...parents);
            }
        }
    }
    console.log(chalk.red(`Could not find parents for the following moves: ${missingMoves}`));
    return parents;
}
