import { EggGroups, LevelUpMoveData } from "./pokemonlib";

// export type PokemonMovesList = {
//     [pokemon: string]: string[] | LevelUpMovesData;
// };

// export type SpeciesMoves = {
//     [form: string]: string[] | LevelUpMovesData;
// };

// export enum Inheritance {
//     EggMove = "EGG_MOVE",
//     Tutor = "TUTOR",
//     TranferTutor = "TRANSFER_TUTOR",
//     LevelUp = "LEVELUP",
// }

// export type BeneficiaryMoveData = {
//     learnBy: string[];
// };

// export type Inheritors = {
//     [pokemon: string]: InheritorMoves;
// };

// export type InheritorMoves = {
//     [move: string]: InheritorMoveData;
// };

// export type InheritorMoveData = {
//     inheritanceType: string;
//     beneficiaries: MoveLearnableBy;
// };

export const MOVE_KEYS = ["levelUpMoves", "tutorMoves", "eggMoves", "tmMoves8", "trMoves", "hmMoves", "transferMoves", "tmMoves7"]; //, "tmMoves6", "tmMoves5", "tmMoves4", "tmMoves3", "tmMoves2", "tmMoves1", "tmMoves"];
export const INHERITABLE_KEYS = ["tutorMoves", "eggMoves", "transferMoves"]; //, "levelUpMoves" //todo

//! Libraries
export type InheritableMoves = {
    [pokemon: string]: {
        [move: string]: {
            parents: [string, string[]][];
            //todo improve
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
