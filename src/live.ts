import { argv } from "process";

export function isProduction(): boolean {
    return argv.slice(2).includes("live");
}
