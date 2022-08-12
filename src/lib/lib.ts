import { EggGroups, FormData, LevelUpMoveData, PokemonData } from "./pokemonlib";

export const MOVE_KEYS = ["levelUpMoves", "tutorMoves", "eggMoves", "tmMoves8", "trMoves", "hmMoves", "transferMoves", "tmMoves7"]; //, "tmMoves6", "tmMoves5", "tmMoves4", "tmMoves3", "tmMoves2", "tmMoves1", "tmMoves"];
export const INHERITABLE_KEYS = ["tutorMoves", "eggMoves", "transferMoves"]; //, "levelUpMoves" //todo

//! Libraries
export type InheritableMoves = {
    [pokemon: string]: {
        [move: string]: {
            parents: {
                [parentName: string]: LearnMethodInfo;
            };
            type: string;
        };
    };
};

export type LearnMethodInfo = {
    learnMethod: string;

    //? If egg move
    parents?: string[];

    //? If levelup move
    level?: number;
};

export type MoveSources = {
    [move: string]: {
        [pokemon: string]: string[];
    };
};

export type EggGroupsLib = {
    [group in EggGroups]?: string[];
};

export type Forms = {
    [pokemon: string]: FormData;
};

export type AllPokemonData = {
    [pokemon: string]: PokemonData;
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

export type ParentInfo = {
    parent: string;
    amount: number;
    inMoves: string[];
    notInMoves: string[];
};
