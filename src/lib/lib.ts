import { EggGroups, FormData, LevelUpMoveData } from "./pokemonlib";

export const MOVE_KEYS = ["levelUpMoves", "tutorMoves", "eggMoves", "tmMoves8", "trMoves", "hmMoves", "transferMoves", "tmMoves7"]; //, "tmMoves6", "tmMoves5", "tmMoves4", "tmMoves3", "tmMoves2", "tmMoves1", "tmMoves"];
export const INHERITABLE_KEYS = ["tutorMoves", "eggMoves", "transferMoves"]; //, "levelUpMoves" //todo

//! Libraries
export type InheritableMoves = {
    [pokemon: string]: {
        [move: string]: {
            parents: {
                [parentName: string]: string[];
            };
        };
    };
};

export type MoveSources = {
    [move: string]: {
        [pokemon: string]: string[];
    };
};

export type EggGroupsLib = {
    [group in EggGroups]?: string[];
};

export type LevelUpMoves = {
    [pokemon: string]: LevelUpMoveData[];
};

export type Forms = {
    [pokemon: string]: FormData;
};

//! Functional
export type SuggestedMove = {
    move: string;
    usage: number;
    method: string;
    parents: {
        [parent: string]: string[]; //todo
    };
};
