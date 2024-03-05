import {RuleOnErrorFixInfo} from "markdownlint"

export function computeSuggestion (
  lineNumber: number,
  lineContent: string,
  fixInfo: RuleOnErrorFixInfo
): string | undefined {
  if (fixInfo.lineNumber) {
    return computeSuggestionWhenLineNumberIsDefined(
      lineNumber,
      lineContent,
      fixInfo
    )
  } else if (fixInfo.editColumn || fixInfo.insertText || fixInfo.deleteCount) {
    const column = fixInfo.editColumn ? fixInfo.editColumn - 1 : 0
    const newText = fixInfo.insertText ? fixInfo.insertText : ""
    const deleteCount = fixInfo.deleteCount ? fixInfo.deleteCount : 0
    return (
      lineContent.slice(0, column) +
      newText +
      lineContent.slice(column + deleteCount)
    )
  }
  return undefined
}

function computeSuggestionWhenLineNumberIsDefined (
  lineNumber: number,
  lineContent: string,
  fixInfo: RuleOnErrorFixInfo
): string | undefined {
  if (
    fixInfo.lineNumber === lineNumber + 1 &&
    fixInfo.insertText?.startsWith("\n")
  ) {
    return lineContent + fixInfo.insertText
  }
}
