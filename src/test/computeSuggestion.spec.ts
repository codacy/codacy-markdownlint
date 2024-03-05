import {deepStrictEqual} from "assert"
import {FixInfo, RuleOnErrorFixInfo} from "markdownlint"

import {computeSuggestion} from "../computeSuggestion"

describe("computeSuggestion", () => {
  const lineContent = "- Identify new Static Analysis issues"
  const lineNumber = 3
  it("should generate a suggestion replacing text", () => {
    const fix: FixInfo = {
      "editColumn": 1,
      "deleteCount": 1,
      "insertText": "*"
    }

    const result = computeSuggestion(lineNumber, lineContent, fix)
    const expectedResult = "* Identify new Static Analysis issues"

    deepStrictEqual(result, expectedResult)
  })
  it("should generate a suggestion deleting text", () => {
    const fix: FixInfo = {
      "editColumn": 1,
      "deleteCount": 11
    }

    const result = computeSuggestion(lineNumber, lineContent, fix)
    const expectedResult = "new Static Analysis issues"

    deepStrictEqual(result, expectedResult)
  })
  it("should generate a suggestion adding text", () => {
    const fix: FixInfo = {
      "editColumn": 38,
      "insertText": " on Codacy"
    }

    const result = computeSuggestion(lineNumber, lineContent, fix)
    const expectedResult = "- Identify new Static Analysis issues on Codacy"

    deepStrictEqual(result, expectedResult)
  })
  it("should not generate a suggestion when fixInfo.lineNumber is distant from the issue line", () => {
    const fix: RuleOnErrorFixInfo = {
      "insertText": "\nsome text",
      "lineNumber": 5
    }

    const result = computeSuggestion(lineNumber, lineContent, fix)
    const expectedResult = undefined

    deepStrictEqual(result, expectedResult)
  })
})
