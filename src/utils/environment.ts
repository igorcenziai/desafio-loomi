import fs from "fs"
import path from "path"
import { type Environment } from "../interfaces/Environment.js"

export function getEnvironmentData(): Environment {
    let vars: Record<string, any> = {}
    try {
        const varsPath = path.resolve(process.cwd(), "env.json")
        const varsContent = fs.readFileSync(varsPath, "utf-8")
        vars = JSON.parse(varsContent)
        for (const [key, value] of Object.entries(vars)) {
            if (!process.env[key]) {
                process.env[key] = String(value)
            }
        }

        return vars as Environment
    } catch (err) {
        console.warn("Could not load vars.json:", err)
    }
    return {} as Environment
}