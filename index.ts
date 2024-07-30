import { get_static } from "./static";

// static file server
Bun.serve({
	async fetch(req) {
		const resp = await get_static(req);
		if (resp) return resp;

		if (new URL(req.url).pathname === "/random") {
			const random = Math.floor(Math.random() * 100);
			return new Response(`Random number: ${random}`);
		}

		return new Response("Not found", { status: 404 });
	},
});
