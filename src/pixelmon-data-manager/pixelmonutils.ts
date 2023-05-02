import is from "@sindresorhus/is";
import { LearnMethodInfo, MoveLearnData, MoveParents } from "../lib/lib";
import { error, unboundLog } from "../lib/logger";
import { Pokemon } from "../lib/pokemon";
import { DataManager } from "./data_manager";
import { LevelUpMoveData, MoveKeys } from "./pixelmonlib";

const __CONTEXT__ = "PixelmonUtils";
const LOG = false;
const log = (...data: any) => unboundLog(LOG, __CONTEXT__, "#121212", ...data);

export function getParentsForMove(pokemon: Pokemon, move: string, method: MoveKeys): string[] {
    const out: string[] = [];

    for (const potentialParentName of DataManager.getPokemonInEggGroups(...pokemon.getEggGroups())) {
        const potentialParent = DataManager.Pokemon.get(potentialParentName);
        if (potentialParent === undefined) {
            throw error("Could not fetch Pokemon Data for", potentialParentName);
        }

        if (!potentialParent.canLearn(move)) {
            continue;
        }

        // Check if parent can pass it
        if (parentIsValid(pokemon, potentialParent, method)) {
            out.push(potentialParentName);
        }
    }
    return out;
}

export function getMoveParents(parents: string[], move: string): MoveParents {
    const out: MoveParents = {};
    for (const parent of parents) {
        out[parent] = DataManager.MoveRegistry.getPokemonMoves(parent)?.get(move)!;
    }
    return out;
}

export function parentIsValid(base: Pokemon, parent: Pokemon, method: MoveKeys): boolean {
    //* If same species, return
    if (base.toString() === parent.toString()) return false;

    //* Check if they share an Egg Group
    if (!shareEggGroup(base, parent)) return false;

    //* If parent can't be male, return
    if (parent.malePercentage === 0) return false;

    //* Don't include Egg Moves of same evo line
    //todo not entirely true, Dragapult Sucker Punch, todo notSoonTM
    if (isSameEvoLine(base, parent) && method === "eggMoves") return false;
    return true;
}

export function shareEggGroup(pokemon1: Pokemon, pokemon2: Pokemon): boolean {
    for (const [group, pokemonInGroup] of DataManager.EggGroups) {
        if (pokemonInGroup.includes(pokemon1.toString()) && pokemonInGroup.includes(pokemon2.toString())) return true;
    }
    return false;
}

export function isSameEvoLine(pokemon1: Pokemon, pokemon2: Pokemon) {
    return pokemon1.getBasic().toString() === pokemon2.getBasic().toString();
}

export function toPokemonName(species: string, form: string): string {
    return form === "" ? species : `${species}-${form}`;
}

export function findBasicPreevolution(preEvolutions: string[]): Pokemon {
    for (const pr of preEvolutions) {
        const prPokemon = DataManager.Pokemon.get(pr) || getDefaultFormOfSpecies(pr);
        if (!prPokemon) {
            throw console.log("prPokemon null", preEvolutions);
        }
        if (is.undefined(prPokemon.preEvolutions) || prPokemon.preEvolutions.length === 0) return prPokemon;
    }
    throw log(error("Could not find a basic stage in"), preEvolutions);
}

export function getFormWithTag(speciesName: string, tag: string): Pokemon | null {
    for (const form of DataManager.FormIndex[speciesName]) {
        const pokemon = DataManager.Pokemon[toPokemonName(speciesName, form)];
        if (!is.undefined(pokemon.tags) && pokemon.tags.includes(tag)) {
            return pokemon;
        }
    }
    return null;
}

export function getDefaultFormOfSpecies(speciesName: string): Pokemon | null {
    const pokemon: Pokemon = DataManager.Pokemon[speciesName];
    if (!is.undefined(pokemon)) {
        return pokemon;
    }

    // No "speciesname" form, need to find default form
    if (is.undefined(DataManager.FormIndex[speciesName] || DataManager.FormIndex[speciesName].length === 0)) {
        log(error(`No default form can be found for ${speciesName}`));
        return null;
    }

    const temp: Pokemon = DataManager.Pokemon[toPokemonName(speciesName, DataManager.FormIndex[speciesName][0])];
    const defaultForm: string = temp.getDefaultFormName();
    return DataManager.Pokemon[toPokemonName(speciesName, defaultForm)] || null;
}

export function hasForm(speciesName: string, formName: string): boolean {
    return DataManager.FormIndex[speciesName].includes(formName);
}

export function forEachPokemon(callback: (pokemon: Pokemon) => void) {
    for (const pokemonName in DataManager.Pokemon) {
        callback(DataManager.Pokemon[pokemonName]);
    }
}

/** Extracts moves from the LevelUpMove format, to a unified map of movename => empty LearnMethodInfo obj */
export function extractLearnMethodInfoBase(move: string | LevelUpMoveData): Map<string, LearnMethodInfo> {
    const out = new Map();
    if (is.string(move)) {
        out.set(move, {
            learnMethods: [],
        });
    } else {
        for (const moveName of move.attacks) {
            out.set(moveName, {
                learnMethods: [],
                level: move.level,
            });
        }
    }
    return out;
}

export function parentsThatLearnFromMethod(pokemonName: string, move: string, method: MoveKeys = "levelUpMoves") {
    return DataManager.LEARNABLE_MOVES[pokemonName][move].parents?.filter((p) => DataManager.LEARNABLE_MOVES[p][move].learnMethods.includes(method));
}
