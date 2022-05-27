import { Codacyrc, Pattern } from "codacy-seed"
import { Configuration, Options, promises } from "markdownlint"
import { toolName } from "./toolMetadata"
import { fromPairs } from "lodash"
import * as glob from "glob"

function patternsToRules(patterns: Pattern[]) {
  const rules = patterns.map((pattern) => {
    const patternId = pattern.patternId
    if (pattern.parameters) {
      const parameters = fromPairs(
        pattern.parameters.map((p) => [p.name, p.value])
      )
      return [patternId, parameters]
    } else {
      return [patternId, true]
    }
  })
  rules.push(["default", true])
  return fromPairs(rules)
}

async function createConfiguration(
  codacyInput?: Codacyrc
): Promise<Configuration | undefined> {
  if (codacyInput && codacyInput.tools) {
    const markdownlint = codacyInput.tools.find(
      (tool) => tool.name === toolName
    )
    if (markdownlint && markdownlint.patterns) {
      return patternsToRules(markdownlint.patterns)
    }
  }
  try {
    return await promises.readConfig(".markdownlint.json")
  } catch (error) {
    console.error(`Failed to read the .markdownlint.json file. Cause: ${error}`)
    return undefined
  }
}

export async function configCreator(codacyInput?: Codacyrc): Promise<Options> {
  const configuration = await createConfiguration(codacyInput)

  const files =
    codacyInput && codacyInput.files ? codacyInput.files : glob.sync("**/*.md")
  const options: Options = {
    files: files,
    config: configuration,
    resultVersion: 3,
  }
  return options
}
