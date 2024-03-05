import {Codacyrc, Pattern} from "codacy-seed"
import {glob} from "glob"
import {fromPairs} from "lodash"
import {Configuration, Options, promises} from "markdownlint"

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

async function generateMarkdownlintOptions (
  codacyrc?: Codacyrc
): Promise<Configuration | undefined> {
  if (codacyrc?.tools?.[0]?.patterns && codacyrc.tools[0].patterns.length) {
    return patternsToRules(codacyrc.tools[0].patterns)
  }

  try {
    return await promises.readConfig(".markdownlint.json")
  } catch (e) {
    debug("No .markdownlint.json file found")
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
