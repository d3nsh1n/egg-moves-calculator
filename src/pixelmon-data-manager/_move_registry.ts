import { LearnMethodInfo } from "../lib/lib";
import { PokemonRegistry } from "./_pokemon_registry";
import { MoveKeys } from "./pixelmonlib";
import { getParentsForMove } from "./pixelmonutils";

export class MoveRegistry {
    private Pokemon: Map<string, Set<string>> = new Map();
    private Moves: Map<string, Set<string>> = new Map();
    private LearnInfo: Map<[string, string], LearnMethodInfo> = new Map();

    constructor(pokemonRegistry: PokemonRegistry) {
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
                    if (learnInfo.learnMethods.includes("eggMoves")) {
                        learnInfo.parents = getParentsForMove(pokemon, move, "eggMoves");
                    }
                    this.addMove(pokemonName, move, learnInfo);
                }
            }
        }
    }

    public addMove(pokemon: string, move: string, learnInfo: LearnMethodInfo) {
        // Register Move and Pokemon
        const existingPokemonData = this.Pokemon.getOrCreate(pokemon, new Set([]));
        const existingMoveData = this.Moves.getOrCreate(move, new Set([]));
        existingPokemonData.add(move);
        existingMoveData.add(pokemon);

        // Store Info
        const existingInfo = this.LearnInfo.get([pokemon, move]);
        if (existingInfo !== undefined) {
            // Move is learned via more than one means, append new data
            existingInfo.learnMethods.push(...learnInfo.learnMethods);
            existingInfo.level = learnInfo.level;
        } else {
            // First encounter of move
            this.LearnInfo.set([pokemon, move], learnInfo);
        }
    }

    public getPokemonMoves(pokemon: string): Map<string, LearnMethodInfo> | undefined {
        const out = new Map();
        const moves = this.Pokemon.get(pokemon);
        if (moves === undefined) return undefined;

        for (const move of moves) {
            const inf = this.LearnInfo.get([pokemon, move]);
            out.set(move, inf);
        }
        return out;
    }

    public getMoveSources(move: string): Map<string, LearnMethodInfo> {
        const out = new Map();
        const pokemon = this.Moves.get(move);
        if (pokemon === undefined) return out;

        for (const poke of pokemon) {
            const inf = this.LearnInfo.get([poke, move]);
            out.set(poke, inf);
        }
        return out;
    }
}
