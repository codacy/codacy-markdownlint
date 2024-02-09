import {
    DescriptionEntry,
    DescriptionParameter,
    ParameterSpec,
    PatternSpec,
    Specification,
    writeFile,
  } from "codacy-seed"
import axios from "axios"
import { promises as fs } from "fs"
import markdownlint from "markdownlint"

export class DocGenerator {
  docsPath = "./docs/"
  repositoryUrlBase = "https://raw.githubusercontent.com/DavidAnson/markdownlint/v" + markdownlint.getVersion() + "/"

  ruleLink = new RegExp("<a name=.*<\/a>")

  private readonly rules

  constructor() {
    this.rules = require("../../node_modules/markdownlint/lib/rules.js")
    this.createFolderIfNotExists(this.docsPath + "description")
  }
 
  getPatternIds(): string[] {
      return this.rules.map((rule: { names: string[] }) => rule.names[0])
  }

  getPatternId(title: string): string {
    return title.split("-")[0].replace("~~", "").replace("`", "").replace("`", "").trim()
  }

  cleanRuleTitle(title: string): string {
    return title.replace(/~~/g, "")
  }

  createDescriptionFiles() {
    Promise.all(this.getPatternIds().map(async (patternId) => {
      const url = this.repositoryUrlBase + "doc/" + patternId.toLowerCase() + ".md"
      const response = await fetch(url)

      if (!response.ok) {
        const message = `Failed to retrieve docs for ${patternId} from ${url}`
        console.log(message)
        return
      }

      const content = await response.text()
      const filename = this.docsPath + "description/" + patternId + ".md"

      await writeFile(filename, content)
    }))
  }

  static toDisablePattern(patternId: string): boolean {
    const disabled = ['MD013','MD043','MD041','MD009','MD040','MD031','MD047']
    return !disabled.includes(patternId)
  }

  async generateSpecification(patternsSchema: any) {
    const patternSpecs: PatternSpec[] = this.getPatternIds().map((patternId) => {
      const propertiesStructure = patternsSchema["properties"][patternId]

      var parametersSpecs: ParameterSpec[] = []
      if (propertiesStructure && propertiesStructure["properties"]) { 
        var propertiesNames = Object.keys(propertiesStructure["properties"])
        parametersSpecs = propertiesNames.map((property) => 
          new ParameterSpec(property, propertiesStructure["properties"][property]["default"])
        )
      }
    const defaultPropertyValue = !DocGenerator.toDisablePattern(patternId)
        ? false
        : propertiesStructure?.["default"] && patternsSchema["properties"][patternId]["default"] === true
      
      return new PatternSpec(
        patternId,
        "Info",
        "CodeStyle",
        undefined,
        parametersSpecs,
        defaultPropertyValue
      )
    })
    
    const specification = new Specification("markdownlint", markdownlint.getVersion(), patternSpecs);
    await writeFile(this.docsPath + "patterns.json", JSON.stringify(specification, null, 2));
  }

  async generatePatternsDescription(patternsSchema: any) {
    const descriptionEntries = this.rules.map((rule: { names: string[], description: string }) => {
      const patternId = rule.names[0]
      const ruleSchema = patternsSchema["properties"][patternId]

      var parameters: DescriptionParameter[] = []
      if (ruleSchema && ruleSchema["properties"]) {
        var propertiesNames = Object.keys(ruleSchema["properties"])
        parameters = propertiesNames.map((property) => {
          return new DescriptionParameter(property, ruleSchema["properties"][property]["description"])
        })
      }

      const title = this.cleanRuleTitle("`" + patternId + "` - " + rule.description)
      return new DescriptionEntry(patternId, title, rule.description, undefined, parameters)
    })

    await writeFile(this.docsPath + "description/description.json", JSON.stringify(descriptionEntries, null, 2) + "\n")
  }

  private async createFolderIfNotExists(dir: string) {
    await fs.access(dir).catch(_ => fs.mkdir(dir))
  }

}

async function main() {
    const docGenerator = new DocGenerator()
    docGenerator.createDescriptionFiles()

    const rulesSchemaRequest = await axios.get(docGenerator.repositoryUrlBase + "schema/markdownlint-config-schema.json")
    await docGenerator.generateSpecification(rulesSchemaRequest.data)
    await docGenerator.generatePatternsDescription(rulesSchemaRequest.data)
}

main()

