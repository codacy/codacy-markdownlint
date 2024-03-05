import {deepEqual} from "assert"
import {Issue, ToolResult} from "codacy-seed"
import {LintResults} from "markdownlint"

import {convertResults} from "../convertResults"

describe("convertResults", () => {
  it("should convert a Markdownlint report into Codacy results", async () => {
    const report: LintResults = {
      "README.md": [
        {
          "lineNumber": 62,
          "ruleNames": [
            "MD004",
            "ul-style"
          ],
          "ruleDescription": "Unordered list style",
          "ruleInformation": "https://github.com/DavidAnson/markdownlint/blob/v0.23.1/doc/Rules.md#md004",
          "errorDetail": "Expected: asterisk; Actual: dash",
          "errorContext": "",
          "errorRange": [
            1,
            2
          ]
        },
        {
          "lineNumber": 63,
          "ruleNames": [
            "MD013",
            "line-length"
          ],
          "ruleDescription": "Line length",
          "ruleInformation": "https://github.com/DavidAnson/markdownlint/blob/v0.23.1/doc/Rules.md#md013",
          "errorDetail": "Expected: 80; Actual: 106",
          "errorContext": "",
          "errorRange": [
            81,
            26
          ]
        }
      ]
    }

    const results = await convertResults(report, {})
    const expected: ToolResult[] = [
      new Issue("README.md", "Expected: asterisk; Actual: dash", "MD004", 62),
      new Issue("README.md", "Expected: 80; Actual: 106", "MD013", 63)
    ]

    deepEqual(results, expected)
  })
})
