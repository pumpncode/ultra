import { walk } from "https://deno.land/std@0.115.1/fs/mod.ts";

const {
	readTextFile,
	writeTextFile
} = Deno;

const {
	imports
} = JSON.parse(await readTextFile("./modules.json"));

const modifiedImports = { ...imports };

modifiedImports.ultra = "https://raw.githubusercontent.com/nnmrts/ultra/url-imports/mod.ts"

const fixEntry = async ({
	path,
	name,
	isFile
}) => {
	console.log(path);
	console.log(name);

	const isFileWithPossibleImports = name.match(/\.(?:j|t)sx?$/) !== null;

	const isNotInDotGithub = !path.startsWith(".github");

	const relevant = isFile && isFileWithPossibleImports && isNotInDotGithub

	if (relevant) {
		console.log("relevant");

		const js = await readTextFile(path);

		let newJs = js;

		for (const [name, url] of Object.entries(modifiedImports)) {
			const regex = new RegExp(`^import((?:(?!import)(?:.|\\n))*)"${name}";$`, "gm");

			newJs = newJs.replaceAll(regex, `import$1"${url}"`);
		}

		await writeTextFile(path, newJs);
	}
}

for await (const entry of walk(".")) {
	await fixEntry(entry);
}

