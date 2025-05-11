import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import puppeteerCore from 'puppeteer-core';
import { dev } from '$app/environment';

// We don't need to define a type here, we'll use any for the dynamic import
let puppeteer: any;

export const POST: RequestHandler = async ({ request }) => {
	let browser: Browser | null = null;
	try {
		console.log('Generating movie card...');
		const data = await request.json();
		const { 
			title, 
			year, 
			poster, 
			rating, 
			genre, 
			runtime, 
			overview, 
			type, 
			insights = [], 
			language, 
			actors,
			streamingLinks = [] 
		} = data;
		
		console.log('Movie data received:', { 
			title, 
			poster: poster ? (poster.substring(0, 50) + '...') : 'No poster provided', 
			rating
		});

		// Validate essential inputs
		if (!title) {
			console.error('Missing required field: title');
			return json({ error: 'Title is required' }, { status: 400 });
		}
		
		if (!poster || poster === '/placeholder-movie.png' || poster === '/placeholder.png') {
			console.log('Using fallback poster for:', title);
			// We could provide a default poster image here
		}

		// Create HTML template with enhanced design
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
                        background: linear-gradient(135deg, rgba(229, 9, 20, 0.15), rgba(0, 0, 0, 0.95));
                        overflow: hidden;
                        box-shadow: inset 0 0 200px rgba(0, 0, 0, 0.9);
                    }
                    .background-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: url('${poster}');
                        background-size: cover;
                        background-position: center;
                        opacity: 0.15;
                        filter: blur(20px);
                        z-index: 0;
                    }
                    .content-wrapper {
                        display: flex;
                        gap: 60px;
                        width: 100%;
                        z-index: 1;
                        position: relative;
                    }
                    .poster-container {
                        position: relative;
                        min-width: 380px;
                        filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.5));
                    }
                    .poster {
                        width: 380px;
                        height: 570px;
                        border-radius: 16px;
                        object-fit: cover;
                        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(229, 9, 20, 0.3);
                        border: 2px solid rgba(255, 255, 255, 0.2);
                        outline: 1px solid rgba(0, 0, 0, 0.2);
                    }
                    .rating-badge {
                        position: absolute;
                        bottom: -20px;
                        right: -20px;
                        width: 90px;
                        height: 90px;
                        border-radius: 50%;
                        background: #E50914;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 32px;
                        font-weight: bold;
                        box-shadow: 0 4px 20px rgba(229, 9, 20, 0.5);
                        border: 3px solid rgba(255, 255, 255, 0.2);
                        color: white;
                    }
                    .content {
                        flex: 1;
                        padding-top: 10px;
                        display: flex;
                        flex-direction: column;
                    }
                    .title-container {
                        margin-bottom: 10px;
                        background: rgba(0, 0, 0, 0.4);
                        padding: 10px 16px;
                        border-radius: 12px;
                        backdrop-filter: blur(10px);
                        display: inline-block;
                    }
                    .title {
                        font-size: 52px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        line-height: 1.2;
                        background: linear-gradient(90deg, #fff, #ccc);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
                    }
                    .year {
                        display: inline-block;
                        font-size: 32px;
                        color: #E50914;
                        font-weight: 500;
                        margin-left: 15px;
                        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                    }
                    .metadata {
                        color: rgba(255, 255, 255, 0.85);
                        font-size: 20px;
                        margin-bottom: 24px;
                        display: flex;
                        gap: 15px;
                        flex-wrap: wrap;
                    }
                    .metadata-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        background: rgba(0, 0, 0, 0.3);
                        padding: 6px 12px;
                        border-radius: 8px;
                        backdrop-filter: blur(10px);
                    }
                    .metadata-icon {
                        width: 20px;
                        height: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                        background: rgba(229, 9, 20, 0.3);
                    }
                    .overview {
                        color: rgba(255, 255, 255, 0.9);
                        font-size: 20px;
                        line-height: 1.5;
                        margin-bottom: 24px;
                        display: -webkit-box;
                        -webkit-line-clamp: 4;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        background: rgba(0, 0, 0, 0.3);
                        padding: 12px 16px;
                        border-radius: 12px;
                        backdrop-filter: blur(10px);
                        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
                    }
                    .section-title {
                        font-size: 20px;
                        font-weight: 600;
                        margin-bottom: 12px;
                        color: rgba(255, 255, 255, 0.9);
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                    }
                    .genres {
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                        margin-bottom: 24px;
                    }
                    .genre {
                        background: rgba(229, 9, 20, 0.2);
                        color: #ff5252;
                        padding: 8px 16px;
                        border-radius: 16px;
                        font-size: 16px;
                        border: 1px solid rgba(229, 9, 20, 0.4);
                        backdrop-filter: blur(5px);
                        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
                        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                    }
                    .insights {
                        list-style-type: none;
                        padding: 0;
                        margin: 0 0 20px 0;
                    }
                    .insight-item {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 8px;
                        color: rgba(255, 255, 255, 0.9);
                        background: rgba(0, 0, 0, 0.25);
                        padding: 8px 14px;
                        border-radius: 10px;
                        backdrop-filter: blur(5px);
                    }
                    .insight-icon {
                        color: #E50914;
                        font-size: 20px;
                    }
                    .streaming-platforms {
                        display: flex;
                        gap: 12px;
                        flex-wrap: wrap;
                        margin-top: auto;
                    }
                    .platform {
                        background: rgba(255, 255, 255, 0.15);
                        padding: 8px 16px;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        backdrop-filter: blur(5px);
                        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                        font-weight: 500;
                    }
                    .actors {
                        font-size: 16px;
                        color: rgba(255, 255, 255, 0.85);
                        margin-bottom: 20px;
                        background: rgba(0, 0, 0, 0.25);
                        padding: 10px 14px;
                        border-radius: 10px;
                        backdrop-filter: blur(5px);
                    }
                    .watermark {
                        position: absolute;
                        bottom: 30px;
                        right: 40px;
                        font-size: 24px;
                        font-weight: 600;
                        background: linear-gradient(90deg, #E50914, #ff5252);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        opacity: 0.9;
                        filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="background-overlay"></div>
                    <div class="content-wrapper">
                        <div class="poster-container">
                            <img class="poster" src="${poster}" alt="${title}" />
                            ${rating ? `<div class="rating-badge">${rating}%</div>` : ''}
                        </div>
                        <div class="content">
                            <div class="title-container">
                                <h1 class="title">
                                    ${title}
                                    ${year ? `<span class="year">${year}</span>` : ''}
                                </h1>
                            </div>
                            
                            <div class="metadata">
                                ${type ? `
                                <div class="metadata-item">
                                    <span class="metadata-icon">📺</span>
                                    <span>${type.toUpperCase()}</span>
                                </div>` : ''}
                                
                                ${runtime ? `
                                <div class="metadata-item">
                                    <span class="metadata-icon">⏱️</span>
                                    <span>${runtime}</span>
                                </div>` : ''}
                                
                                ${language ? `
                                <div class="metadata-item">
                                    <span class="metadata-icon">🌐</span>
                                    <span>${language}</span>
                                </div>` : ''}
                            </div>
                            
                            ${actors ? `
                            <div class="actors">
                                <strong>Starring:</strong> ${actors}
                            </div>` : ''}
                            
                            ${overview ? `<p class="overview">${overview}</p>` : ''}
                            
                            ${genre ? `
                            <div class="section-title">Genres</div>
                            <div class="genres">
                                ${genre.split(', ')
                                    .map((g: string) => `<span class="genre">${g}</span>`)
                                    .join('')}
                            </div>` : ''}
                            
                            ${insights && insights.length > 0 ? `
                            <div class="section-title">Highlights</div>
                            <ul class="insights">
                                ${insights.slice(0, 3).map((insight: string) => `
                                <li class="insight-item">
                                    <span class="insight-icon">✨</span>
                                    <span>${insight}</span>
                                </li>`).join('')}
                            </ul>` : ''}
                            
                            ${streamingLinks && streamingLinks.length > 0 ? `
                            <div class="section-title">Available on</div>
                            <div class="streaming-platforms">
                                ${streamingLinks.slice(0, 4).map((link: {platform: string}) => `
                                <div class="platform">${link.platform}</div>`).join('')}
                            </div>` : ''}
                        </div>
                    </div>
                    <div class="watermark">watsch.tv</div>
                </div>
            </body>
            </html>
        `;

		console.log('HTML template created, launching browser...');

		// In development, use the full puppeteer package which includes Chrome
		if (dev) {
			console.log('Development mode detected, using full puppeteer');
			try {
				// Dynamic import of puppeteer for local development
				puppeteer = await import('puppeteer').then(m => m.default || m);
				
				console.log('Launching browser with bundled Chromium...');
				browser = await puppeteer.launch({
					args: ['--hide-scrollbars', '--disable-web-security'],
					defaultViewport: { width: 1200, height: 675 },
					headless: true
				});
			} catch (importError) {
				console.error('Failed to import full puppeteer:', importError);
				return json({ error: 'Failed to initialize browser in development mode' }, { status: 500 });
			}
		} else {
			// For production, use the lighter chromium-min
			try {
				// Create browser instance with chromium-min
				let executablePath;
				try {
					executablePath = await chromium.executablePath();
					console.log('Using Chromium executable path:', executablePath);
				} catch (error) {
					console.warn('Error getting Chromium executable path:', error);
					// Fallback for non-standard environments
					console.log('Using fallback path');
					executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/tmp/chromium';
				}
				
				console.log('Launching browser with executable path:', executablePath);
				browser = await puppeteerCore.launch({
					args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
					defaultViewport: { width: 1200, height: 675 },
					executablePath,
					headless: true
				});
			} catch (launchError) {
				console.error('Failed to launch browser with chromium-min:', launchError);
				return json({ error: 'Failed to initialize browser in production mode' }, { status: 500 });
			}
		}
		
		if (!browser) {
			console.error('Failed to initialize browser');
			return json({ error: 'Failed to initialize browser' }, { status: 500 });
		}
		
		console.log('Creating page...');
		const page = await browser.newPage();
		
		// Set content and wait for it to load
		console.log('Setting HTML content...');
		await page.setContent(html, { waitUntil: 'networkidle0' });
		
		console.log('Taking screenshot...');
		const screenshot = await page.screenshot({ type: 'png' });
		
		// Close browser
		if (browser) {
			console.log('Closing browser...');
			await browser.close();
			browser = null;
		}
		
		console.log('Sending response...');
		return new Response(screenshot, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
				'Pragma': 'no-cache',
				'Expires': '0',
			}
		});

	} catch (error) {
		console.error('Error generating movie card:', error);
		
		// Always close browser if something goes wrong
		if (browser) {
			try {
				await browser.close();
			} catch (closeError) {
				console.error('Error closing browser:', closeError);
			}
			browser = null;
		}
		
		return json({ error: 'Failed to generate movie card: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
	}
};
