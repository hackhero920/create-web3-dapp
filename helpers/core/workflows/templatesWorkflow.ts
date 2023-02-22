import open from "open";
import path from "path";
import prompts from "prompts";
import kill from "../../utils/kill.js";
import { validateProjectName } from "../../utils/validation.js";
import context from "../context.js";
import { generateDapp } from "../generateDapp.js";
import { selfDestroy, setRoot } from "../selfDestroy.js";

export async function startTemplatesWorkflow(useBackend = false) {
	context.dappInfo.isTemplate = true;
	context.dappInfo.chain = "ETH_MAINNET";
	context.dappInfo.isEVM = true;
	context.dappInfo.useBackend = useBackend;
	context.dappInfo.backendProvider = "hardhat-template";

	let step = 0;
	let quit = false;
	while (!quit) {
		let exit = 0;
		switch (step) {
			case 0:
				try {
					while (!context.projectName) {
						if (exit >= 2) {
							kill();
						}
						exit++;
						const projectPath = await prompts({
							type: "text",
							name: "projectPath",
							message: "Please, insert a project name",
							initial: "my-create-web3-dapp",
							validate: (value: string) =>
								validateProjectName(value),
						}).then((data) => data.projectPath);
						if (projectPath) {
							context.resolvedProjectPath =
								path.resolve(projectPath);
							context.projectName = path.basename(
								context.resolvedProjectPath
							);
							setRoot(context.resolvedProjectPath);
						}
					}
				} catch (e) {
					selfDestroy(e);
				}
				step++;
				break;

			case 1:
				try {
					const hasAccount: string = await prompts({
						type: "toggle",
						name: "hasAccount",
						message: "Do you already have an Alchemy account?",
						initial: true,
						active: "yes",
						inactive: "no",
					}).then((data) => data.hasAccount);
					if (typeof hasAccount == "boolean") {
						if (!hasAccount) {
							open(
								"https://auth.alchemy.com/?a=create-web3-dapp "
							);
						}
						step++;
						break;
					} else {
						process.exit();
					}
				} catch (e) {
					selfDestroy(e);
				}
				break;

			case 2:
				try {
					const alchemyAPIKey: string = await prompts({
						type: "text",
						name: "apiKey",
						message:
							"Insert your Alchemy API Key (create an account at https://auth.alchemy.com/?a=create-web3-dapp):",
						initial: "",
					}).then((data) => data.apiKey);
					if (
						alchemyAPIKey.length < 32 ||
						alchemyAPIKey.length > 33
					) {
						break;
					}

					context.dappInfo.apiKeys.ALCHEMY_API_KEY =
						alchemyAPIKey.length ? alchemyAPIKey : "demo";

					quit = true;
				} catch (e) {
					selfDestroy(e);
				}

				break;
		}
	}
	generateDapp();
}
