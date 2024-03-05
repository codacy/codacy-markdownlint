import {deepStrictEqual} from "assert"
import {Issue, ToolResult} from "codacy-seed"
import {Options, promises} from "markdownlint"

import {convertResults} from "../convertResults"

async function checkResults (strings: {[x: string]: string}, options: Options, expected: ToolResult[]) {
  const report = await promises.markdownlint(options)

  const results = convertResults(report, strings)

  deepStrictEqual(results, expected)
}

describe("markdownlint", () => {
  it("should report missing surrounding line on line after title", async () => {
    const strings = {
      "content": "# Title\nparagraph"
    }

    const options: Options = {
      "strings": strings,
      "config": {
        "MD022": true,
        "MD032": false,
        "MD041": false,
        "MD047": false
      },
      "resultVersion": 3
    }

    const expected: ToolResult[] = [
      new Issue("content", "Expected: 1; Actual: 0; Below", "MD022", 1, "# Title\n")
    ]

    await checkResults(strings, options, expected)
  })
  it("should report missing surrounding line on line before title", async () => {
    const strings = {
      "content": "paragraph\n# Title"
    }

    const options: Options = {
      "strings": strings,
      "config": {
        "MD022": true,
        "MD032": false,
        "MD041": false,
        "MD047": false
      },
      "resultVersion": 3
    }

    const expected: ToolResult[] = [
      new Issue("content", "Expected: 1; Actual: 0; Above", "MD022", 2, "\n# Title")
    ]

    await checkResults(strings, options, expected)
  })
})
