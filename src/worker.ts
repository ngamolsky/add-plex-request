/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Client } from '@notionhq/client';
import { sendEmail } from './email';

type Env = Record<string, string>;

const PLEX_PATH = '/plex';

async function fetch(request: Request, env: Env) {
	const method = request.method;

	const requestPath = new URL(request.url).pathname;

	// Handle the "plex" path
	if (requestPath === PLEX_PATH) {
		const apiKey = env.NOTION_INTEGRATION_KEY;
		const databaseId = env.NOTION_PLEX_REQUEST_DATABASE_ID;
		const correctPassword = env.PLEX_PASSWORD;

		if (method === 'POST') {
			const body = (await request.json()) as { title: string; why: string; who: string; password: string };
			const title = body.title;
			const why = body.why;
			const who = body.who;
			const password = body.password;

			// Allow CORS request from localhost
			const headers = new Headers(request.headers);

			headers.set('Access-Control-Allow-Origin', 'http://localhost:8000');
			headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
			headers.set('Access-Control-Allow-Headers', 'Content-Type');
			headers.set('Access-Control-Max-Age', '86400');

			// Password check is case insensitive
			if (password.toLowerCase() !== correctPassword.toLowerCase()) {
				return new Response('Incorrect password', {
					status: 401,
					headers: headers,
				});
			}

			await addPlexRequest(apiKey, databaseId, title, why, who);

			await sendEmail(
				env.SENDGRID_API_KEY,
				env.SENDGRID_FROM_EMAIL,
				env.SENDGRID_TO_EMAIL,
				'New Plex Request from ' + who,
				`<p>There is a new Plex request from ${who}.</p><p><strong>Title:</strong> ${title}</p><p><strong>Why:</strong> ${why}</p>`
			);

			const response = new Response('Record Added: ' + title, { status: 201, headers: headers });

			return response;
		} else {
			return new Response('Method not allowed', { status: 405 });
		}
	} else {
		return new Response('Not found', { status: 404 });
	}
}

async function addPlexRequest(apiKey: string, databaseId: string, title: string, why: string, who: string) {
	const notion = new Client({ auth: apiKey });

	await notion.pages.create({
		parent: {
			database_id: databaseId,
			type: 'database_id',
		},
		properties: {
			'What should I add?': {
				type: 'title',
				title: [
					{
						text: {
							content: title,
						},
					},
				],
			},
			'Why should I add it?': {
				type: 'rich_text',
				rich_text: [
					{
						text: {
							content: why,
						},
					},
				],
			},
			'Who is this?': {
				type: 'rich_text',
				rich_text: [
					{
						text: {
							content: who,
						},
					},
				],
			},
		},
	});
}

export default {
	fetch,
};
