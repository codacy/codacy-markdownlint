import {
    DescriptionEntry,
    DescriptionParameter,
    ParameterSpec,
    PatternSpec,
    Specification,
    writeFile,
  } from "codacy-seed"
import axios from "axios"
import * as md2json from "md-2-json"
import { promises as fs } from "fs"
import markdownlint from "markdownlint"

const docsPath = "../docs/"

const repositoryUrlBase = "https://raw.githubusercontent.com/DavidAnson/markdownlint/v" + markdownlint.getVersion() + "/"

const ruleLink = new RegExp("<a name=.*<\/a>")

function getPatternId(title: string): string {
    return title.split("-")[0].replace("~~", "").replace("`", "").replace("`", "").trim()
}

function cleanRuleTitle(title: string): string {
    return title.replace(/~~/g, "")
}

async function createDescriptionFiles(rules: string[], rulesJson: any) {
    Promise.all(rules.map(async (rule, i, arrays) => {
        const body = rulesJson[rule]["raw"].replace(ruleLink, "").trim()
        const content = "# " + cleanRuleTitle(rule) + "\n\n" + body
        const ruleId = getPatternId(rule)
        await fs.writeFile(docsPath + "description/" + ruleId + ".md", content)
    }))
}

async function generateSpecification(ruleTitles: string[], patternsSchema: any) {
    const patternSpecs = ruleTitles.map((ruleTitle) => {
        const ruleId = getPatternId(ruleTitle)
        const propertiesStructure = patternsSchema["properties"][ruleId]
        var parametersSpecs: ParameterSpec[] = []
        if (!propertiesStructure || !propertiesStructure["properties"])
        { 1 }
        else {
            var propertiesNames = Object.keys(propertiesStructure["properties"])
            parametersSpecs = propertiesNames.map((property) => 
                new ParameterSpec(property, propertiesStructure["properties"][property]["default"])
            )
        }
        if (!propertiesStructure || !propertiesStructure["default"])
        {
            const enabled = false
            return new PatternSpec(ruleId, "Info", "CodeStyle", undefined, parametersSpecs, enabled)
        }
        else {
        const enabled = patternsSchema["properties"][ruleId]["default"] === true
        return new PatternSpec(ruleId, "Info", "CodeStyle", undefined, parametersSpecs, enabled)
        }
    })

    const specification = new Specification("markdownlint", markdownlint.getVersion(), patternSpecs)
    await writeFile(docsPath + "patterns.json", JSON.stringify(specification, null, 2))
}

async function generatePatternsDescription(ruleTitles: string[], patternsSchema: any) {
    const descriptionEntries = ruleTitles.map((ruleTitle) => {
        const ruleId = getPatternId(ruleTitle)

        const ruleSchema = patternsSchema["properties"][ruleId]
        let description = ""
        if (!ruleSchema || !ruleSchema["description"]) {
            description = ""
        }
        else {
        description =  ruleSchema["description"].split(" - ")[1]
        }

        var parameters: DescriptionParameter[] = []
        if(!ruleSchema || !ruleSchema["properties"]) {
            1
        }
        else {
            var propertiesNames = Object.keys(ruleSchema["properties"])
            parameters = propertiesNames.map((property) => {
                return new DescriptionParameter(property, ruleSchema["properties"][property]["description"])
            })
        }

        const title = cleanRuleTitle(ruleTitle)
        return new DescriptionEntry(ruleId, title, description, undefined,  parameters)
    })

    await writeFile(docsPath + "description/description.json", JSON.stringify(descriptionEntries, null, 2) + "\n")
}

async function createFolderIfNotExists(dir: string) {
    const accessPromise = fs.access(dir)
    await accessPromise.catch(_ => fs.mkdir(dir))
}

async function main() {
    await createFolderIfNotExists(docsPath + "description")

    const rulesRequest = await axios.get(repositoryUrlBase + "doc/Rules.md")

    const rulesJson = md2json.parse(rulesRequest.data)

    const rulesSchemaRequest = await axios.get(repositoryUrlBase + "schema/markdownlint-config-schema.json")

    const rules = Object.keys(rulesJson["Rules"]).filter(a => a != "raw")

    await createDescriptionFiles(rules, rulesJson["Rules"])

    await generateSpecification(rules, rulesSchemaRequest.data)

    await generatePatternsDescription(rules, rulesSchemaRequest.data)
    
    return rules
}

main()
