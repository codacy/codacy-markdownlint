import {Codacyrc, Engine, ToolResult} from "codacy-seed"
import {readFile} from "codacy-seed"
import {promises} from "markdownlint"

import {configCreator} from "./configCreator"
import {convertResults} from "./convertResults"
import {debug} from "./logging"

export const engineImpl: Engine = async function (
  codacyrc?: Codacyrc
): Promise<ToolResult[]> {
  const options = await configCreator(codacyrc)

  const markdownlintResults = await promises.markdownlint(options)

  debug(markdownlintResults)

  const files = await Promise.all(
    codacyrc?.files?.map(async (file) => {
      const fileContent = await readFile(file)
      return [file, fileContent.toString()]
    }) || []
  )

  return convertResults(
    markdownlintResults,
    Object.fromEntries(files)
  )
}
