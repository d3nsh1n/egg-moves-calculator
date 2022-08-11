import fs from "fs-extra";
import { DataLib } from "./tools/dataLib";
import "./tools/dataLoader";
import { DataLoader } from "./tools/dataLoader";
const filePath = "data/species/092_gastly.json";
export async function main() {
    new DataLib();
    new DataLoader(true);
}
export function writeToTest(data) {
    fs.writeFileSync("data/test.json", JSON.stringify(data, null, 4));
}
main();
//# sourceMappingURL=main.js.map