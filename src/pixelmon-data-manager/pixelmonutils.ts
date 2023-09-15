import is from "@sindresorhus/is";
import { LearnMethodInfo, MoveLearnData, MoveParents } from "../lib/lib";
import { Pokemon } from "../lib/pokemon";
import { DataManager } from "./_data_manager";
import { LevelUpMoveData, MoveKeys } from "./pixelmonlib";
import { Logger } from "../lib/logger";

const { log, warn, error } = new Logger(true, "PixelmonUtils", "#121212");

export function getParentsForMove(pokemon: Pokemon, move: string, method: MoveKeys): string[] {
    const out: string[] = [];
    // log(pokemon.toString());
    for (const potentialParentName of DataManager.EggGroupRegistry.get(...pokemon.getEggGroups())) {
        const potentialParent = DataManager.PokemonRegistry.get(potentialParentName);
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
    for (const [group, pokemonInGroup] of DataManager.EggGroupRegistry.all()) {
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
        const prPokemon = DataManager.PokemonRegistry.get(pr, true) || getDefaultFormOfSpecies(pr);
        if (!prPokemon) {
            throw log("prPokemon null", preEvolutions);
        }
        if (is.undefined(prPokemon.preEvolutions) || prPokemon.preEvolutions.length === 0) return prPokemon;
    }
    throw log(error("Could not find a basic stage in"), preEvolutions);
}

export function getFormWithTag(speciesName: string, tag: string): Pokemon | null {
    for (const form of DataManager.PokemonRegistry.Forms.get(speciesName)!) {
        const pokemon = DataManager.PokemonRegistry.get(toPokemonName(speciesName, form));
        if (!is.undefined(pokemon.tags) && pokemon.tags.includes(tag)) {
            return pokemon;
        }
    }
    return null;
}

export function getDefaultFormOfSpecies(speciesName: string): Pokemon | null {
    const pokemon = DataManager.PokemonRegistry.get(speciesName, true);
    if (!is.undefined(pokemon)) {
        return pokemon;
    }

    // No "speciesname" form, need to find default form
    const forms = DataManager.PokemonRegistry.Forms.get(speciesName);
    if (is.undefined(forms) || forms.length === 0) {
        log(error(`No default form can be found for ${speciesName}`));
        return null;
    }

    const temp: Pokemon = DataManager.PokemonRegistry.get(toPokemonName(speciesName, DataManager.PokemonRegistry.Forms.get(speciesName)![0]));
    const defaultForm: string = temp.getDefaultFormName();
    return DataManager.PokemonRegistry.get(toPokemonName(speciesName, defaultForm)) || null;
}

export function hasForm(speciesName: string, formName: string): boolean {
    return DataManager.PokemonRegistry.Forms.get(speciesName)?.includes(formName) || false;
}

export function forEachPokemon(callback: (pokemon: Pokemon) => void) {
    for (const pokemonName in DataManager.PokemonRegistry) {
        callback(DataManager.PokemonRegistry.get(pokemonName));
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
    return DataManager.MoveRegistry.getPokemonMoves(pokemonName)
        ?.get(move)
        ?.parents?.filter((p) => DataManager.MoveRegistry.getPokemonMoves(p)?.get(move)?.learnMethods.includes(method));
}
