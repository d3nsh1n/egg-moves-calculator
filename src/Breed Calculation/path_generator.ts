import { performance } from "perf_hooks";
import { BreedingPath, ParentInfo } from "../lib";
import chalk from "chalk";
import { arrayEquals, deepCopy } from "../utils";
import { unboundLog } from "../logger";
import { isSameEvoLine } from "../Pixelmon Data Manager/pixelmonutils";
import { DataManager } from "../Pixelmon Data Manager/data_manager";

const __CONTEXT__ = "Path Generator";
const DEBUG = false;
const debug = (data: any) => unboundLog(DEBUG, __CONTEXT__, data);

function getCombinations(array: string[], minLength: number = 1, maxLength: number = 4) {
    const subsets: string[][] = [[]];
    for (const el of array) {
        const last = subsets.length - 1;
        for (let i = 0; i <= last; i++) {
            subsets.push([...subsets[i], el]);
        }
    }
    return subsets.filter((subset) => subset.length >= minLength && subset.length <= maxLength);
}

function* subsets(array: string[], offset = 0): any {
    while (offset < array.length) {
        let first = array[offset++];
        for (let subset of subsets(array, offset)) {
            subset.push(first);
            yield subset;
        }
    }
    yield [];
}

export function getBreedingPaths(sortedParentsInfo: ParentInfo[]): BreedingPath[] {
    const startTime = performance.now();

    let index = 0;
    // for (const parent in sortedParentsInfo) {
    //     //resolve parent's paths
    //     somefunc(sortedParentsInfo.slice(index++));
    // }
    const final = [...getParentPaths(sortedParentsInfo)];
    const minLength = Math.min(...final.map((e) => e.length));

    debug(chalk.bgMagenta(`getBreedingPaths took ${(performance.now() - startTime).toFixed(0)} ms.`));
    return final.filter((e) => e.length === minLength);
}

function getParentPaths(parentsToCheck: ParentInfo[], moves?: string[], currentPath?: BreedingPath): BreedingPath[] {
    if (parentsToCheck.length === 0) {
        return [];
    }

    // Create moves and path if not provided
    moves ||= [...parentsToCheck[0].inMoves, ...parentsToCheck[0].notInMoves];
    currentPath ||= { length: 0, parents: [] };

    // Result
    const parentPaths: BreedingPath[] = [];

    let index = 0;
    for (const initialParent of parentsToCheck) {
        index++;
        const remainingMoves = moves.filter((move) => initialParent.notInMoves.includes(move));

        const parentMakesProgress = remainingMoves.length < moves.length;
        if (!parentMakesProgress) {
            continue;
        }

        const branch = deepCopy(currentPath);
        addParentToPath(branch, initialParent);

        //* If path is complete push it, otherwise call recursively for the array tail
        if (remainingMoves.length === 0) {
            parentPaths.push(branch);
        } else {
            parentPaths.push(...getParentPaths(parentsToCheck.slice(index), remainingMoves, branch));
        }
    }

    return parentPaths;
}

function addParentToPath(path: BreedingPath, parent: ParentInfo) {
    path.length++;
    path.parents.push(parent.parent);
    // path.parentInfo[parent.parent] = parent;
}

export function compressPaths(paths: BreedingPath[]) {
    for (const path of paths) {
        for (const parentName of path.parents) {
            if (typeof parentName !== "string") continue;
            const parent = DataManager.POKEMON[parentName];
            for (const otherPath of [...paths.slice(paths.indexOf(path) + 1)]) {
                // if (arrayEquals(path.parents.slice(path.parents.indexOf(parent), 1), otherPath.parents.slice(path.parents.indexOf(parent), 1)))
                for (const otherParentName of otherPath.parents) {
                    if (typeof otherParentName !== "string" || otherParentName === parentName) continue;
                    const otherParent = DataManager.POKEMON[otherParentName];

                    if (isSameEvoLine(otherParent, parent) && arrayEquals(path.parents.slice(path.parents.indexOf(parentName, 1)), otherPath.parents.slice(otherPath.parents.indexOf(otherParentName, 1)))) {
                        console.log([[parentName, otherParentName], ...path.parents.slice(path.parents.indexOf(parentName, 1))]);
                    }
                }
            }
        }
    }
}
