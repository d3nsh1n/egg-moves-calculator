import is from "@sindresorhus/is";

export type PokemonJSON = {
    name: string;
    dex: number;
    defaultForms: string[];
    forms: Form[];
    generation: number;
};
export function isPokemonJSON(value: any): value is PokemonJSON {
    if (is.undefined(value)) return false;
    if (!is.string(value.name)) return false;
    if (!is.number(value.dex)) return false;
    if (!is.array<string>(value.defaultForms)) return false;
    if (!is.array<Form>(value.name, isForm)) return false;
    if (!is.number(value.generation)) return false;
    return true;
}

export type Form = {
    name: string;
    experienceGroup: string; //todo enum/type?
    dimensions: Irrelevant;
    moves: Moves;
    abilities: Abilities;
    movement: Irrelevant;
    aggression: Irrelevant;
    battleStats: Irrelevant;
    tags: Irrelevant;
    spawn: Irrelevant;
    possibleGenders: ("MALE" | "FEMALE")[];
    genderProperties: Irrelevant;
    eggGroups: EggGroups;
    types: Types;
    preEvolutions: Irrelevant;
    defaultBaseForm: Irrelevant;
    megaItems: Irrelevant;
    megas: Irrelevant;
    gigantamax: Irrelevant;
    eggCycles: Irrelevant;
    weight: Irrelevant;
    catchRate: Irrelevant;
    malePercentage: number;
    evolutions: Evolution[];
    evYields: Irrelevant;
};
export function isForm(value: any): value is Form {
    if (is.undefined(value)) return false;
    if (!is.string(value.name)) return false;
    if (!is.string(value.experienceGroup)) return false;
    if (!isMoves(value.moves)) return false;
    if (!isAbilities(value.abilities)) return false;
    if (!isPossibleGenders(value.possibleGenders)) return false;
    if (!isEggGroups(value.eggGroups)) return false;
    if (!isTypes(value.types)) return false;
    if (!is.number(value.malePercentage)) return false;
    if (!is.array<Evolution>(value.evolutions)) return false;
    return true;
}

export type Moves = {
    levelUpMoves: Irrelevant;
    tutorMoves: Irrelevant;
    eggMoves: string[];
    tmMoves8: string[];
    trMoves: string[];
    hmMoves: string[];
    transferMoves: string[];
    tmMoves7: string[];
    tmMoves6: string[];
    tmMoves5: string[];
    tmMoves4: string[];
    tmMoves3: string[];
    tmMoves2: string[];
    tmMoves1: string[];
    tmMoves: string[];
};
export function isMoves(value: any): value is Moves {
    if (is.undefined(value)) return false;
    if (!is.array<string>(value.eggMoves)) return false;
    if (!is.array<string>(value.tmMoves8)) return false;
    if (!is.array<string>(value.trMoves)) return false;
    if (!is.array<string>(value.hmMoves)) return false;
    if (!is.array<string>(value.transferMoves)) return false;
    if (!is.array<string>(value.tmMoves7)) return false;
    if (!is.array<string>(value.tmMoves6)) return false;
    if (!is.array<string>(value.tmMoves5)) return false;
    if (!is.array<string>(value.tmMoves4)) return false;
    if (!is.array<string>(value.tmMoves3)) return false;
    if (!is.array<string>(value.tmMoves2)) return false;
    if (!is.array<string>(value.tmMoves1)) return false;
    if (!is.array<string>(value.tmMoves)) return false;
    return true;
}

export type Abilities = {
    //todo
};
export function isAbilities(value: any): value is Abilities {
    return true;
}

export type Evolution = {
    //todo
};
export function isEvolution(value: any): value is Evolution {
    return true;
}

export enum EggGroups {}
//todo
export function isEggGroups(value: any): value is EggGroups {
    return true;
}

export enum Types {}
//todo
export function isTypes(value: any): value is Types {
    return true;
}

export type Irrelevant = {};
export function isIrrelevant(value: any): value is Irrelevant {
    return true;
}

export function isPossibleGenders(value: any): boolean {
    return true;
}
