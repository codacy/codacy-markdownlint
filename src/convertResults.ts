import {Issue} from "codacy-seed"
import {LintResults} from "markdownlint"

import {computeSuggestion} from "./computeSuggestion"

export function convertResults (
  report: LintResults,
  filenameToContent: {[x: string]: string}
): Issue[] {
  return Object.entries(report).flatMap((entry) => {
    const [filename, issues] = entry
    const fileContent = filenameToContent[filename]
    const lines = fileContent?.split("\n")
    return issues.map((issue) => {
      const lineNumber = issue.lineNumber
      const message = issue.errorDetail ?? issue.ruleDescription
      const patternId = issue.ruleNames[0]
      const suggestion =
        lines && issue.fixInfo
          ? computeSuggestion(lineNumber, lines[lineNumber - 1], issue.fixInfo)
          : undefined
      return new Issue(filename, message, patternId, lineNumber, suggestion)
    })
  })
}
