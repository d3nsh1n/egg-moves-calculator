import { performance } from "perf_hooks";
import { LearnMethodInfo } from "../lib/lib";
import { Logger } from "../lib/logger";
import { PokemonRegistry } from "./_pokemon_registry";
import { MoveKeys } from "./pixelmonlib";
import { getParentsForMove } from "./pixelmonutils";
import chalk from "chalk";

const { log, warn, error } = new Logger(true, "MoveRegistry", "#133387");

export class MoveRegistry {
    private Pokemon: Map<string, Set<string>> = new Map();
    private Moves: Map<string, Set<string>> = new Map();
    private LearnInfo: Map<string, LearnMethodInfo> = new Map();

    private Temp: {
        [pokemon: string]: {
            [move: string]: LearnMethodInfo;
        };
    } = {};

    constructor(private pokemonRegistry: PokemonRegistry) {
        for (const [pokemonName, pokemon] of pokemonRegistry.all()) {
            // Pokemon: {
            //     moves: {
            //         levelupMoves: [ ... ],
            //         tutorMoves: [ ... ]
            //     }
            // }
            for (const learnMethod in pokemon.moves) {
                const movesLearnInfo = pokemon.getMovesLearnInfo(learnMethod as MoveKeys);
                for (const [move, learnInfo] of movesLearnInfo) {
                    // if (learnInfo.learnMethods.includes("eggMoves")) {
                    //     learnInfo.parents = getParentsForMove(pokemon, move, "eggMoves");
                    // }

                    this.Temp[pokemonName] ||= {};
                    this.Temp[pokemonName][move] = learnInfo;
                    // this.addMove(pokemonName, move, learnInfo);
                }
            }
        }
    }

    public populateEggMoves() {
        let startTime = performance.now();
        const TIMES = new Map();
        for (const pokemonName in this.Temp) {
            const pokemon = this.pokemonRegistry.get(pokemonName);
            for (const move in this.Temp[pokemonName]) {
                const learnInfo = this.Temp[pokemonName][move];
                if (learnInfo.learnMethods.includes("eggMoves")) {
                    learnInfo.parents = getParentsForMove(pokemon, move, "eggMoves");
                }
            }
        }
        // for (const [pokemonName, moves] of this.Pokemon) {
        //     let t1 = performance.now();
        //     const pokemon = this.pokemonRegistry.get(pokemonName);
        //     const pokemonMoves = this.getPokemonMoves(pokemonName);
        //     if (pokemonMoves === undefined) {
        //         error("Could not get move data for", pokemonName);
        //         return;
        //     }
        //     for (const [move, learnInfo] of pokemonMoves) {
        //         if (learnInfo.learnMethods.includes("eggMoves")) {
        //             learnInfo.parents = getParentsForMove(pokemon, move, "eggMoves");
        //         }
        //     }
        //     const t2 = (performance.now() - t1).toFixed(0);
        //     TIMES.set(pokemonName, t2);
        // }
        // console.log(TIMES);
        log(chalk.bgGreenBright(`Populating Egg Moves took ${(performance.now() - startTime).toFixed(0)} milliseconds to initialize.`));
    }

    public addMove(pokemon: string, move: string, learnInfo: LearnMethodInfo) {
        // Register Move and Pokemon
        const existingPokemonData = this.Pokemon.getOrCreate(pokemon, new Set([]));
        const existingMoveData = this.Moves.getOrCreate(move, new Set([]));
        existingPokemonData.add(move);
        existingMoveData.add(pokemon);

        // Store Info
        const existingInfo = this.LearnInfo.get(toKey(pokemon, move));
        if (existingInfo !== undefined) {
            // Move is learned via more than one means, append new data
            existingInfo.learnMethods.push(...learnInfo.learnMethods);
            existingInfo.level = learnInfo.level;
        } else {
            // First encounter of move
            this.LearnInfo.set(toKey(pokemon, move), learnInfo);
        }
    }

    public getPokemonMoves(pokemon: string): {
        [move: string]: LearnMethodInfo;
    } {
        return this.Temp[pokemon];
        // const out = new Map();
        // const moves = this.Pokemon.get(pokemon);
        // if (moves === undefined) return undefined;

        // for (const move of moves) {
        //     const inf = this.LearnInfo.get(toKey(pokemon, move));
        //     out.set(move, inf);
        // }
        // return out;
    }

    public getMoveSources(move: string): Map<string, LearnMethodInfo> {
        const out = new Map();
        const pokemon = this.Moves.get(move);
        if (pokemon === undefined) return out;

        for (const poke of pokemon) {
            const inf = this.LearnInfo.get(toKey(poke, move));
            out.set(poke, inf);
        }
        return out;
    }

    //
}
// Arbitrary key format for LearnInfo Map
function toKey(pokemon: string, move: string) {
    return `${pokemon}:${move}`;
}
