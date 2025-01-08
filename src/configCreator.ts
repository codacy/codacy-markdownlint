import {Codacyrc, Pattern} from "codacy-seed"
import {glob} from "glob"
import {fromPairs} from "lodash"
import {Configuration, Options, promises} from "markdownlint"
import { promises as fs } from "fs"

import {debug} from "./logging"

function patternsToRules (patterns: Pattern[]): Configuration {
  const rules = patterns.map((pattern) => {
    return [
      pattern.patternId,
      pattern.parameters
        ? fromPairs(pattern.parameters.map((p) => [p.name, p.value]))
        : true
    ]
  })
  rules.unshift(["default", false])
  return fromPairs(rules)
}

const configFiles = [
  ".markdownlint.yml",
  ".markdownlint.yaml",
  ".markdownlint.jsonc",
  ".markdownlint.json"
]

async function findMarkdownLintConfig(): Promise<string | undefined> {
  for (const file of configFiles) {
    try {
      await fs.access(file) // Check if the file exists
      return file // Return the first existing file
    } catch {
      // File doesn't exist, continue to the next one
    }
  }
  return undefined // No config file found
}

async function generateMarkdownlintOptions(
  codacyrc?: Codacyrc
): Promise<Configuration | undefined> {
  if (codacyrc?.tools?.[0]?.patterns && codacyrc.tools[0].patterns.length) {
    return patternsToRules(codacyrc.tools[0].patterns)
  }

  try {
    const configFile = await findMarkdownLintConfig()
    if (configFile) {
      return await promises.readConfig(configFile)
    }
    debug("No markdownlint config file found")
  } catch (e) {
    debug("Error reading markdownlint config:")
    return undefined
  }
}

async function generateFilesToAnalyze (
  codacyrc?: Codacyrc
): Promise<string[]> {
  debug("files: creating")

  const files = codacyrc?.files && codacyrc.files.length
    ? codacyrc.files
    : await glob("**/*.md")

  debug("files: finished")
  return files
}

export async function configCreator (codacyrc?: Codacyrc): Promise<Options> {
  debug("config: creating")

  const configuration = await generateMarkdownlintOptions(codacyrc)
  const files = await generateFilesToAnalyze(codacyrc)
  const options: Options = {
    "files": files,
    "config": configuration,
    "resultVersion": 3
  }

  debug(options)
  debug("config: finished")
  return options
}
