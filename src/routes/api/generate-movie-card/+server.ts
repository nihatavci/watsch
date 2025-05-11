import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

export const POST: RequestHandler = async ({ request }) => {
	let browser: Browser | null = null;
	try {
		const { title, year, poster, rating, genre, runtime, overview, type } = await request.json();

		// Create HTML template
		const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        background: #0A0A0A;
                        font-family: 'Inter', sans-serif;
                        width: 1200px;
                        height: 675px;
                        display: flex;
                        color: white;
                        overflow: hidden;
                    }
                    .container {
                        display: flex;
                        padding: 40px;
                        gap: 60px;
                        width: 100%;
                        position: relative;
                    }
                    .poster {
                        width: 380px;
                        height: 570px;
                        border-radius: 12px;
                        object-fit: cover;
                    }
                    .content {
                        flex: 1;
                        padding-top: 20px;
                    }
                    .title {
                        font-size: 48px;
                        font-weight: bold;
                        margin-bottom: 20px;
                        line-height: 1.2;
                    }
                    .metadata {
                        color: #999;
                        font-size: 24px;
                        margin-bottom: 24px;
                    }
                    .overview {
                        color: #ccc;
                        font-size: 20px;
                        line-height: 1.4;
                        margin-bottom: 32px;
                        display: -webkit-box;
                        -webkit-line-clamp: 3;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }
                    .genres {
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                    }
                    .genre {
                        background: rgba(229, 9, 20, 0.15);
                        color: #E50914;
                        padding: 8px 16px;
                        border-radius: 16px;
                        font-size: 18px;
                    }
                    .watermark {
                        position: absolute;
                        bottom: 30px;
                        right: 40px;
                        color: rgba(255, 255, 255, 0.5);
                        font-size: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <img class="poster" src="${poster}" alt="${title}" />
                    <div class="content">
                        <h1 class="title">${title}${year ? ` (${year})` : ''}</h1>
                        <div class="metadata">
                            ${[runtime, rating ? `${rating}%` : null, type?.toUpperCase()]
															.filter(Boolean)
															.join(' • ')}
                        </div>
                        ${overview ? `<p class="overview">${overview}</p>` : ''}
                        ${
													genre
														? `
                            <div class="genres">
                                ${genre
																	.split(', ')
																	.map(
																		(g: string) => `
                                    <span class="genre">${g}</span>
                                `
																	)
																	.join('')}
                            </div>
                        `
														: ''
												}
                    </div>
                    <div class="watermark">watsch.tv</div>
                </div>
            </body>
            </html>
        `;

		// Launch browser
		browser = await puppeteer.launch({
			args: chromium.args,
			defaultViewport: {
				width: 1200,
				height: 675
			},
			executablePath: await chromium.executablePath(),
			headless: chromium.headless,
			ignoreDefaultArgs: false
		});

		// Create new page and set content
		const page = await browser.newPage();
		await page.setContent(html, { waitUntil: 'networkidle0' });

		// Take screenshot
		const buffer = await page.screenshot({
			type: 'png',
			quality: 100
		});

		await browser.close();
		browser = null;

		// Return the image
		return new Response(buffer, {
			headers: {
				'Content-Type': 'image/png',
				'Content-Disposition': `attachment; filename="${title
					.replace(/[^a-z0-9]/gi, '-')
					.toLowerCase()}-watsch.png"`
			}
		});
	} catch (error) {
		console.error('Error generating movie card:', error);
		if (browser) {
			await browser.close();
		}
		return json({ error: 'Failed to generate movie card' }, { status: 500 });
	}
};
