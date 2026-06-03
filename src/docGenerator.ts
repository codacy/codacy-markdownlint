import axios from "axios";
import { DescriptionEntry, DescriptionParameter, ParameterSpec, PatternSpec, Specification, writeFile } from "codacy-seed";
import { promises as fs } from "fs";
import { getVersion } from "markdownlint";
// @ts-ignore
import rules from "../../node_modules/markdownlint/lib/rules.mjs";

export class DocGenerator {
    docsPath = "./docs/";
    repositoryUrlBase = "https://raw.githubusercontent.com/DavidAnson/markdownlint/v" + getVersion() + "/";
    ruleLink = new RegExp("<a name=.*</a>");
    rules: any;

    constructor() {
        this.rules = rules;
        this.createFolderIfNotExists(this.docsPath + "description");
    }

    getPatternIds() {
        return this.rules.map((rule: any) => rule.names[0]);
    }

    getPatternId(title: string) {
        return title.split("-")[0].replace(/[~`]/g, "").trim();
    }

    cleanRuleTitle(title: string) {
        return title.replace(/~~/g, "");
    }

    async createDescriptionFiles() {
        await Promise.all(this.getPatternIds().map(async (patternId: string) => {
            const url = this.repositoryUrlBase + "doc/" + patternId.toLowerCase() + ".md";
            const response = await fetch(url);
            if (!response.ok) {
                const message = `Failed to retrieve docs for ${patternId} from ${url}`;
                console.log(message);
                return;
            }
            const content = await response.text();
            const filename = this.docsPath + "description/" + patternId + ".md";
            await writeFile(filename, content);
        }));
    }

    static isDefaultPattern(patternId: string, propertiesStructure: any) {
        const disabled = [
            "MD013",
            "MD043",
            "MD041",
            "MD009",
            "MD040",
            "MD031",
            "MD047",
            "MD058",
            "MD059",
            "MD060"
        ];
        return !disabled.includes(patternId) && propertiesStructure && propertiesStructure["default"];
    }

    private getRuleProperties(ruleSchema: any): any {
        if (!ruleSchema) return undefined;
        if (ruleSchema["properties"]) return ruleSchema["properties"];
        // Dig into anyOf/oneOf to find the properties object
        const variants = ruleSchema["anyOf"] || ruleSchema["oneOf"];
        if (variants && Array.isArray(variants)) {
            // verify that each item is a non-null object before accessing its properties
            // this prevents potential runtime errors if the schema contains unexpected non-object variants.
            const objectVariant = variants.find((item: any) => item && typeof item === "object" && item.type === "object" && item["properties"]);
            if (objectVariant) {
                return objectVariant["properties"];
            }
        }
        return undefined;
    }

    async generateSpecification(patternsSchema: any) {
        const patternSpecs = this.getPatternIds()
            .map((patternId: string) => {
            const ruleSchema = patternsSchema["properties"][patternId];
            let parametersSpecs: ParameterSpec[] = [];
            const properties = this.getRuleProperties(ruleSchema);

            if (properties) {
                const propertiesNames = Object.keys(properties);
                
                // filter out severity and enabled properties from each pattern
                parametersSpecs = propertiesNames
                    .filter((property) => property !== "severity" && property !== "enabled")
                    .map((property) => new ParameterSpec(property, properties[property]["default"]));
            }
            return new PatternSpec(patternId, "Info", "CodeStyle", undefined, parametersSpecs, DocGenerator.isDefaultPattern(patternId, ruleSchema));
        });
        const specification = new Specification("markdownlint", getVersion(), patternSpecs);
        await writeFile(this.docsPath + "patterns.json", JSON.stringify(specification, null, 2));
    }

    async generatePatternsDescription(patternsSchema: any) {
        const descriptionEntries = this.rules.map((rule: any) => {
            const patternId = rule.names[0];
            const ruleSchema = patternsSchema["properties"][patternId];
            let parameters: DescriptionParameter[] = [];
            const properties = this.getRuleProperties(ruleSchema);

            if (properties) {
                const propertiesNames = Object.keys(properties);
                parameters = propertiesNames.map((property) => {
                    return new DescriptionParameter(property, properties[property]["description"]);
                });
            }
            const title = this.cleanRuleTitle("`" + patternId + "` - " + rule.description);
            return new DescriptionEntry(patternId, title, rule.description, undefined, parameters);
        });
        await writeFile(this.docsPath + "description/description.json", JSON.stringify(descriptionEntries, null, 2) + "\n");
    }

    async createFolderIfNotExists(dir: string) {
        await fs.access(dir).catch(() => fs.mkdir(dir));
    }
}

async function main() {
    const docGenerator = new DocGenerator();
    await docGenerator.createDescriptionFiles();
    const rulesSchemaRequest = await axios.get(docGenerator.repositoryUrlBase + "schema/markdownlint-config-schema.json");
    await docGenerator.generateSpecification(rulesSchemaRequest.data);
    await docGenerator.generatePatternsDescription(rulesSchemaRequest.data);
}
main();