import { BreedingPath, MoveParents, ParentInfo, SuggestedMove } from "./lib/lib";
import { MoveUsage, toPixelmonMove, toPixelmonName } from "./lib/smogonlib";
import { getMoveUsage } from "./smogon_stats";
import { DataLib } from "./tools/dataLib";
import { DataLoader } from "./tools/dataLoader";
import chalk from "chalk";
import is from "@sindresorhus/is";
import { move } from "fs-extra";

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
    const paths: any = getBreedingPaths(parentsInfo);

    return paths;
}

export function getParentsInfo(suggestedMoves: SuggestedMove[]): ParentInfo[] {
    const parentsInfo: ParentInfo[] = [];
    const parentsChecked: string[] = [];

    //* For each suggested move
    for (const suggestedMove of suggestedMoves) {
        // Parents wont exist for (self) tutor moves
        if (!suggestedMove.parents) continue;

        //* Iterate not already checked parents
        for (const parent in suggestedMove.parents) {
            if (parentsChecked.includes(parent)) continue;

            const inMoves: string[] = [];
            const notInMoves: string[] = [];
            //* Iterate through each move, and count how many of them include the parent as a source
            for (const move of suggestedMoves) {
                // Parents wont exist for (self) tutor moves
                if (!move.parents) continue;

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
    parentsInfo.sort(_sortParentsInfo);
    return parentsInfo;
}

function _sortParentsInfo(a: ParentInfo, b: ParentInfo) {
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

export function getBreedingPaths(sortedParentsInfo: ParentInfo[], moves?: string[], currentPath?: BreedingPath): BreedingPath[] {
    const breedingPaths: BreedingPath[] = [];
    for (const parent of sortedParentsInfo) {
        breedingPaths.push(_getSinglePath(sortedParentsInfo));
        console.log(chalk.bgMagenta("PATH DONE"));
        sortedParentsInfo.splice(sortedParentsInfo.indexOf(parent, 0), 1);
    }
    return breedingPaths;
}

export function _getSinglePath(sortedParentsInfo: ParentInfo[], moves?: string[], currentPath?: BreedingPath): BreedingPath {
    console.log(chalk.bgBlue("CALLED"));
    console.log(
        "sortedParents:",
        sortedParentsInfo.map((p) => p.parent)
    );
    console.log("moves:", moves);
    console.log("currentPath:", currentPath);

    // Guard
    if (sortedParentsInfo.length === 0) {
        console.log(chalk.yellow("[WARN] Empty parentInfo array provided. Could not generate breeding paths."));
        return { length: 0, parents: [], parentInfo: {} };
    }

    // If moves is undefined, assign the combination of inMoves and notInMoves of a (the first) parent
    // Every parent's inMoves and notInMoves should combine to the target moves, picking the first one is (semi) arbitrary.
    // We know [0] exists cause length of array > 0.
    moves ||= [...sortedParentsInfo[0].inMoves, ...sortedParentsInfo[0].notInMoves];

    // Create a new path if one was not provided (normal/first call, not recursive)
    currentPath ||= { length: 0, parents: [], parentInfo: {} };

    // It's important&& for the parentInfo Array to be sorted, as we want the parent with the most provided moves to be first
    // (Or, later, the one that's considered "best")
    // &&(but not really, unless we stop after X found or at a path threshold)
    for (const mainParent of sortedParentsInfo) {
        // Check if parent completes the path
        const remainingMoves = moves.filter((move) => mainParent.notInMoves.includes(move));
        if (remainingMoves.length === 0) {
            // Found last parent
            __addParent(currentPath, mainParent);
            return currentPath;
        }
    }
    //* No parent completed the path
    // Get the next parent that makes progress
    // todo Better criteria, like type/ownership
    const nextParent = __getNextForMove(sortedParentsInfo, moves);
    if (nextParent === null) {
        console.log(chalk.yellow("[WARN] No parents found to complete path. Unobtainable egg move?"));
        console.log(moves);
        return { length: 0, parents: [], parentInfo: {} };
    }

    // Remove parent from array
    sortedParentsInfo.splice(sortedParentsInfo.indexOf(nextParent, 0), 1);
    // Add parent to make progress, call next iteration
    __addParent(currentPath, nextParent);
    moves = moves.filter((move) => nextParent.notInMoves.includes(move));

    // Recursively call this function for the remaining moves
    currentPath = _getSinglePath(sortedParentsInfo, moves, currentPath);

    return currentPath;
}

function __getNextForMove(sortedParentsInfo: ParentInfo[], moves: string[]): ParentInfo | null {
    for (const parent of sortedParentsInfo) {
        for (const move of parent.inMoves) {
            if (moves.includes(move)) {
                return parent;
            }
        }
    }
    // None found
    return null;
}

function __addParent(path: BreedingPath, parent: ParentInfo) {
    path.length++;
    path.parents.push(parent.parent);
    path.parentInfo[parent.parent] = parent;
}
