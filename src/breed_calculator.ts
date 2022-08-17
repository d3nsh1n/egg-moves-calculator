import { BreedingPath, MoveParents, ParentInfo, SuggestedMove } from "./lib/lib";
import { MoveUsage, toPixelmonMove, toPixelmonName } from "./lib/smogonlib";
import { getMoveUsage } from "./smogon_stats";
import { DataLib } from "./tools/dataLib";
import { DataLoader } from "./tools/dataLoader";
import chalk from "chalk";
import is from "@sindresorhus/is";
import { move } from "fs-extra";
import { arrayEquals, getBasic, getFormMoves } from "./lib/utils";
import { performance } from "perf_hooks";

export async function suggestMoves(fullName: string, amount?: number): Promise<SuggestedMove[]> {
    //? You need to compare the MoveUsage of the Final Evo, to the learnset/inheritance of the basic form
    // Convert the name into the pixelmon convention (regional names, add default form if needed)
    const finalEvoFullName = toPixelmonName(fullName);
    const finalEvoFormData = DataLib.FORMS[finalEvoFullName];
    const basicFormFullName = getBasic(finalEvoFullName);

    // Guard
    if (!DataLib.FORMS.hasOwnProperty(basicFormFullName)) {
        console.log(chalk.bgRed(`[ERR!] No data found for ${basicFormFullName}.`));
        return [];
    }
    const form = DataLib.FORMS[basicFormFullName];
    const eggMoves = getFormMoves(form, "eggMoves") as string[];

    //? Grab info for all moves, sort/filter (to 4 or more) before returning
    const suggestedMoves: SuggestedMove[] = [];

    //todo move this on parent function call and pass it as argument here - same level code in funcs
    // Get usage stats for the Pokemon's moves (Should be the final evolution in my use cases)
    const moveUsage: MoveUsage = toPixelmonMove(await getMoveUsage(fullName)) as MoveUsage;
    for (const usedMove in moveUsage) {
        // Guard
        if (!DataLib.INHERITABLE_MOVES[basicFormFullName].hasOwnProperty(usedMove)) {
            console.log(chalk.yellow(`Not inheritable: ${usedMove}`));
            if (DataLib.MOVES_SOURCES[usedMove]?.[fullName] !== undefined) {
                console.log(DataLib.MOVES_SOURCES[usedMove][fullName].learnMethods);
            } else {
                console.log(chalk.yellow(`Could not find data in MoveSources: ${usedMove}/${fullName}`));
            }
            continue;
        }

        // Get learn Info
        const learnMethodInfo = DataLib.INHERITABLE_MOVES[basicFormFullName][usedMove];
        const learnMethods = learnMethodInfo.learnMethods;
        const parents = learnMethodInfo.parents || {};
        if (learnMethods.includes("levelUpMoves")) parents[fullName] = { learnMethods, level: learnMethodInfo.level };

        // Egg Move Guard
        if (eggMoves?.includes(usedMove) && !parents) {
            console.log(chalk.bgRed(`[ERR!] Could not find parents for Egg Move ${usedMove} for ${basicFormFullName}`));
            continue;
        }

        // Build final
        const suggestedMove: SuggestedMove = { move: usedMove, usage: moveUsage[usedMove], learnMethods };
        if (!is.emptyObject(parents)) suggestedMove.parents = parents;

        // Remove move from eggMoves to have a clean list of skipped ones
        if (eggMoves.includes(usedMove)) eggMoves.splice(eggMoves.indexOf(usedMove, 0), 1);

        // Push final
        suggestedMoves.push(suggestedMove);
    }

    console.log(chalk.bgGreen("[INFO] Egg Moves not included:"));
    console.log(eggMoves);
    suggestedMoves.sort(_sortSuggested);
    const end = amount || suggestMoves.length;
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

export function getMinimumParents(suggestedMoves: SuggestedMove[], shortestPathsOnly = true) {
    const parentsInfo: ParentInfo[] = getParentsInfo(suggestedMoves);
    const paths: BreedingPath[] = getBreedingPaths(parentsInfo);

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

export function getBreedingPaths(sortedParentsInfo: ParentInfo[]): BreedingPath[] {
    const startTime = performance.now();

    const breedingPaths: BreedingPath[] = [];
    for (const parent of sortedParentsInfo) {
        breedingPaths.push(..._getParentPaths(sortedParentsInfo));
        sortedParentsInfo.splice(sortedParentsInfo.indexOf(parent, 0), 1);
    }

    const final: BreedingPath[] = [];
    for (const path of breedingPaths) {
        if (path.length === breedingPaths[0].length) {
            final.push(path);
        }

        if (path.length < breedingPaths[0].length) console.log("AHAHAHHAHAHKJASHDFLHDSFLKDSGLKDSFL");
    }

    console.log(chalk.bgMagenta(`getBreedingPaths took ${(performance.now() - startTime).toFixed(0)} ms.`));
    return final;
}

function _getParentPaths(sortedParentsInfo: ParentInfo[], moves?: string[], currentPath?: BreedingPath): BreedingPath[] {
    //! Debug
    // console.log(chalk.bgBlue("CALLED"));
    // console.log(
    //     "sortedParents:",
    //     sortedParentsInfo.map((p) => p.parent)
    // );
    // console.log("moves:", moves);
    // console.log("currentPath:", currentPath);
    //!

    sortedParentsInfo = [...sortedParentsInfo];
    // Guard
    if (sortedParentsInfo.length === 0) {
        // console.log(chalk.yellow("[WARN] Empty parentInfo array provided. Could not generate breeding paths."));
        return [];
    }

    // If moves is undefined, assign the combination of inMoves and notInMoves of a (the first) parent
    // Every parent's inMoves and notInMoves should combine to the target moves, picking the first one is (semi) arbitrary.
    // We know [0] exists cause length of array > 0.
    moves ||= [...sortedParentsInfo[0].inMoves, ...sortedParentsInfo[0].notInMoves];

    // Create a new path if one was not provided (normal/first call, not recursive)
    currentPath ||= { length: 0, parents: [], parentInfo: {} };

    // Result
    const parentPaths: BreedingPath[] = [];

    // It's important&& for the parentInfo Array to be sorted, as we want the parent with the most provided moves to be first
    // (Or, later, the one that's considered "best")
    // &&(but not really, unless we stop after X found or at a path threshold)
    for (const mainParent of sortedParentsInfo) {
        // Check if parent completes the path
        const remainingMoves = moves.filter((move) => mainParent.notInMoves.includes(move));
        //? Dont return, so that you search all parents, in case there are multiple that complete the path in the same step
        if (remainingMoves.length === 0) {
            // console.log(chalk.greenBright(mainParent.parent, "completes the path."));

            // Found (a) last parent

            // Make a deep copy of current path
            const aFullPath = JSON.parse(JSON.stringify(currentPath));

            // Add the parent to complete it
            __addParent(aFullPath, mainParent);

            // Add it to paths
            parentPaths.push(aFullPath);
        }
    }

    // If at least one parent completed the path, return the completed paths
    //! THIS ENSURES THAT SMALLER PATHS HAVE PRIORITY. IF YOU WANT TO GET EVERY PATH, DONT RETURN HERE, BUT FIND A WAY TO PASS THE COMPLETED PATHS
    //! AND BUILD ON THEM ON FURTHER ITERATIONS (WITH MORE PARENTS)
    if (parentPaths.length > 0) {
        return parentPaths;
    }

    //* No parent completed the path
    // console.log(chalk.red("No parents completed the path."));

    // See if any parents would make progress
    const parentsThatMakeProgress = __getNextForMove(sortedParentsInfo, moves);
    // console.log(chalk.bgBlue("Parents that make progress:"));
    // console.log(parentsThatMakeProgress);
    if (parentsThatMakeProgress.length === 0) {
        console.log(chalk.yellow("[WARN] No parents found to make progress. Unobtainable egg move?"));
        console.log(moves);
        return [];
    }

    //* Attempt progress for each parent that makes progress
    for (const nextParent of parentsThatMakeProgress) {
        // Assume this parent gets added, get what moves *would* be missing
        const branchMoves = moves.filter((move) => nextParent.notInMoves.includes(move));

        // Get parents that can make further progress, assuming this parent is already added
        const parentsToCheck = __getNextForMove(parentsThatMakeProgress, branchMoves);

        // Make a copy of current path, and add parent to it
        const branchPath = JSON.parse(JSON.stringify(currentPath));
        __addParent(branchPath, nextParent);
        // console.log(chalk.red(`Forcing progress with ${nextParent.parent}.`));

        // Recursively call this function for the remaining moves
        const res = _getParentPaths(parentsToCheck, branchMoves, branchPath);
        const newPaths = res.filter((p) => !_pathExists(parentPaths, p));
        parentPaths.push(...newPaths);
    }
    return parentPaths;
}

function __getNextForMove(sortedParentsInfo: ParentInfo[], moves: string[]): ParentInfo[] {
    const parentsThatMakeProgress: ParentInfo[] = [];
    for (const parent of sortedParentsInfo) {
        for (const move of parent.inMoves) {
            if (moves.includes(move)) {
                parentsThatMakeProgress.push(parent);
            }
        }
    }
    return parentsThatMakeProgress;
}

function _pathExists(paths: BreedingPath[], path: BreedingPath): boolean {
    for (const p of paths) {
        if (arrayEquals(p.parents, path.parents)) return true;
    }
    return false;
}

function __addParent(path: BreedingPath, parent: ParentInfo) {
    path.length++;
    path.parents.push(parent.parent);
    path.parentInfo[parent.parent] = parent;
}
