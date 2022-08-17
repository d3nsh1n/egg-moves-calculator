import is from "@sindresorhus/is";
import { DataLib } from "../tools/dataLib";
import { getDefaultForm, getSpeciesForm } from "./utils";

//! Helper Functions
//#region Helper Functions

export function toSmogonName(pixelmonName: string): string;
export function toSmogonName(obj: Object): Object;
export function toSmogonName(arg: any): any {
    if (is.string(arg)) {
        //* Convert single string
        const pixelmonName = arg;
        const smogonName = pixelmonName.replace("alolan", "alola").replace("galarian", "galar");
        //
        return smogonName;
    } else {
        //* Convert an object by returning the same object, with string-keys converted
        const result: any = {};
        for (const key of Object.keys(arg)) {
            result[toSmogonName(key)] = arg[key];
        }
        return result;
    }
}

export function toPixelmonName(smogonName: string): string;
export function toPixelmonName(obj: Object): Object;
export function toPixelmonName(arg: any): any {
    if (is.string(arg)) {
        //* Convert single string
        const smogonName = arg;
        const [species, form] = getSpeciesForm(smogonName);

        // Convert regional forms from smogon convention to pixelmon convention
        //? Just replacing doesn't work (like it does in toSmogonName), since these are substrings of the full ones, so you end up with "galarianian"
        //todo Make a cool regex?
        let pixelmonName = smogonName;
        if (form === "alola") {
            pixelmonName = pixelmonName.replace("alola", "alolan");
        } else if (form === "galar") {
            pixelmonName = pixelmonName.replace("galar", "galarian");
        }

        // Turn "Mimikyu" into "Mimikyu-disguise" for example
        pixelmonName = DataLib.FORMS.hasOwnProperty(pixelmonName) ? pixelmonName : `${pixelmonName}-${getDefaultForm(species).name}`;

        //
        return pixelmonName;
    } else {
        //* Convert an object by returning the same object, with string-keys converted
        const result: any = {};
        for (const key of Object.keys(arg)) {
            result[toPixelmonName(key)] = arg[key];
        }
        return result;
    }
}

export function toSmogonMove(pixelmonMove: string): string;
export function toSmogonMove(obj: Object): Object;
export function toSmogonMove(arg: any): any {
    if (is.string(arg)) {
        //* Convert single string
        const pixelmonMove = arg;
        let smogonMove = pixelmonMove;
        //
        return smogonMove;
    } else {
        //* Convert an object by returning the same object, with string-keys converted
        const result: any = {};
        for (const key of Object.keys(arg)) {
            result[toSmogonMove(key)] = arg[key];
        }
        return result;
    }
}

export function toPixelmonMove(smogonMove: string): string;
export function toPixelmonMove(obj: Object): Object;
export function toPixelmonMove(arg: any): any {
    if (is.string(arg)) {
        //* Convert single string
        const smogonMove = arg;
        let pixelmonMove = smogonMove;
        if (smogonMove.includes("Hidden Power")) pixelmonMove = "Hidden Power";
        //
        return pixelmonMove;
    } else {
        //* Convert an object by returning the same object, with string-keys converted
        const result: any = {};
        for (const key of Object.keys(arg)) {
            result[toPixelmonMove(key)] = arg[key];
        }
        return result;
    }
}
//#endregion

//! Types
export type UsageStats = {
    tier: string;
    pokemon: string;
    rank: string;
    usage: string;
    raw: string;
    abilities: {
        [ability: string]: string;
    };
    items: {
        [item: string]: string;
    };
    spreads: {
        [nature: string]: {
            [spread: string]: string;
        };
    };
    moves: UsageMoves;
    teammates: {
        [teammate: string]: string;
    };
    checks: {
        [check: string]: {
            ko: string;
            switched: string;
        };
    };
};

export type UsageMoves = {
    [move: string]: string;
};

export type MoveUsage = {
    [move: string]: number;
};
