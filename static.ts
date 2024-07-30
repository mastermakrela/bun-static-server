import file_list_html from "./file_list.html" assert { type: "text" };

import { readdir, stat } from "node:fs/promises";
import type { PathLike } from "node:fs";

const dev = process.env.NODE_ENV === "development";
const server_root = (process.env.SERVER_ROOT ?? (dev ? "./root" : "./")).replace(/\/$/, "");
const served_dir = new URL(`${server_root}/`, import.meta.url);

export async function get_static(req: Request) {
	if (req.method !== "GET") return;

	const pathname = new URL(req.url).pathname.slice(1);

	let asset_path = new URL(pathname, served_dir);

	if (await is_dir(asset_path)) {
		const files = await readdir(asset_path.pathname, { withFileTypes: true });

		const has_index = files.find((file) => file.name === "index.html");

		if (has_index) {
			asset_path = new URL("index.html", `${asset_path}/`);
		} else {
			let files_rows = "";

			for (const file of files) {
				const info = await stat(`${file.parentPath}/${file.name}`);
				const href = `/${pathname}/${file.name}`.replace(/\/\//, "/");
				files_rows += `<tr>
                    <td><a href="${href}">${file.name}</a></td>
                    <td>${format_size(info.size)}</td>
                    <td>${info.mtime.toLocaleString()}</td>
                </tr>`;
			}

			const message = file_list_html.replace("@@DIR_PATH@@", asset_path.pathname).replace("@@FILES@@", files_rows);

			return new Response(message, { headers: { "Content-Type": "text/html; charset=utf-8" } });
		}
	}

	const file = Bun.file(asset_path);

	if (await file.exists()) {
		return new Response(file);
	}
}

async function is_dir(path: PathLike) {
	try {
		const _stat = await stat(path);
		return _stat.isDirectory();
	} catch (err) {
		return false;
	}
}

function format_size(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
	else if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
	else return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
