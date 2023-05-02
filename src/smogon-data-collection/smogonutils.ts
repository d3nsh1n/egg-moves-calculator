import is from "@sindresorhus/is";
import { DataManager } from "../pixelmon-data-manager/data_manager";
import { getDefaultFormOfSpecies } from "../pixelmon-data-manager/pixelmonutils";

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
        const [species, form] = getSpeciesFormNaive(smogonName);

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

        pixelmonName = !is.undefined(DataManager.Pokemon[pixelmonName]) ? pixelmonName : getDefaultFormOfSpecies(pixelmonName)?.toString() || "NOTFOUND";

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

function getSpeciesFormNaive(fullName: string): [string, string] {
    const uniqueCases = ["Ho-Oh", "Kommo-o", "Hakamo-o", "Jangmo-o", "Porygon-Z"];
    if (uniqueCases.includes(fullName)) {
        return [fullName, ""];
    }

    const species_form = fullName.split("-");
    return [species_form[0], species_form[1] || ""];
}
export function getFullName(species: string, form: string): string {
    const fullName = form === "" ? species : `${species}-${form}`;
    return fullName;
}
