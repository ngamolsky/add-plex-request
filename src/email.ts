export const sendEmail = async (apiKey: string, fromEmail: string, toEmail: string, subject: string, html: string) => {
	const url = 'https://api.sendgrid.com/v3/mail/send';
	const data = {
		personalizations: [
			{
				to: [
					{
						email: toEmail,
					},
				],
			},
		],
		from: {
			email: fromEmail,
		},
		subject: subject,
		content: [
			{
				type: 'text/html',
				value: html,
			},
		],
	};

	const headers = {
		Authorization: `Bearer ${apiKey}`,
		'Content-Type': 'application/json',
	};

	const response = await fetch(url, {
		method: 'POST',
		headers: headers,
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error(`Failed to send email: ${response.status} ${response.statusText}`);
	}
};
