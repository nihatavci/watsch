import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCanvas, loadImage } from 'canvas';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const {
            title,
            year,
            poster,
            rating,
            genre,
            runtime,
            streamingLinks
        } = await request.json();

        // Create canvas with vertical orientation
        const width = 800;
        const height = 1200;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Create solid black background
        ctx.fillStyle = '#0A0A0A';
        ctx.fillRect(0, 0, width, height);

        // Load poster image for background and main display
        const posterImage = await loadImage(poster);

        // Draw blurred background
        const bgWidth = width * 3;
        const bgHeight = height * 3;
        const bgX = -(bgWidth - width) / 2;
        const bgY = -(bgHeight - height) / 2;
        
        // More blur and darker background
        ctx.filter = 'blur(70px) brightness(0.2)';
        ctx.drawImage(posterImage, bgX, bgY, bgWidth, bgHeight);
        ctx.filter = 'none';

        // Add subtle noise texture
        const noiseCanvas = createCanvas(width, height);
        const noiseCtx = noiseCanvas.getContext('2d');
        const imageData = noiseCtx.createImageData(width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const noise = Math.random() * 6;
            data[i] = data[i + 1] = data[i + 2] = 255;
            data[i + 3] = noise;
        }

        noiseCtx.putImageData(imageData, 0, 0);
        ctx.globalAlpha = 0.01;
        ctx.drawImage(noiseCanvas, 0, 0);
        ctx.globalAlpha = 1;

        // Draw gradient overlay with more contrast
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(10, 10, 10, 0.7)');
        gradient.addColorStop(0.6, 'rgba(10, 10, 10, 0.85)');
        gradient.addColorStop(1, 'rgba(10, 10, 10, 0.98)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw main poster with rounded corners
        const posterWidth = width * 0.65;
        const posterHeight = (posterWidth * 1.5);
        const posterX = (width - posterWidth) / 2;
        const posterY = 70;

        // Create rounded rectangle clip path
        ctx.save();
        ctx.beginPath();
        const radius = 24;
        ctx.roundRect(posterX, posterY, posterWidth, posterHeight, radius);
        ctx.clip();
        ctx.drawImage(posterImage, posterX, posterY, posterWidth, posterHeight);
        ctx.restore();

        // Add text content aligned with poster edge
        const textX = posterX;
        let textY = posterY + posterHeight + 60;

        // Title with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(title, textX, textY);
        textY += 50;

        // Year, Runtime, and Rating
        ctx.shadowBlur = 0;
        ctx.font = '28px Arial';
        ctx.fillStyle = '#cccccc';
        let infoText = `${year}`;
        if (runtime) {
            infoText += ` • ${runtime}`;
        }
        if (rating) {
            infoText += ` • ${rating}% Audience Score`;
        }
        ctx.fillText(infoText, textX, textY);
        textY += 50;

        // Genres
        if (genre) {
            const genres = genre.split(', ');
            ctx.font = '24px Arial';
            
            let tagX = textX;
            const tagPadding = 16;
            const tagSpacing = 10;
            const maxTagX = width - posterX;
            
            for (const genreText of genres) {
                ctx.fillStyle = 'rgba(229, 9, 20, 0.15)';
                const textWidth = ctx.measureText(genreText).width;
                const tagWidth = textWidth + (tagPadding * 2);
                
                if (tagX + tagWidth > maxTagX) {
                    tagX = textX;
                    textY += 45;
                }

                ctx.beginPath();
                ctx.roundRect(tagX, textY - 24, tagWidth, 32, 16);
                ctx.fill();
                
                ctx.fillStyle = '#E50914';
                ctx.fillText(genreText, tagX + tagPadding, textY);
                
                tagX += tagWidth + tagSpacing;
            }
            textY += 60;
        }

        // Add watermark
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '20px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('watsch.com', width - posterX, height - 40);

        // Convert canvas to buffer
        const buffer = canvas.toBuffer('image/png');

        return new Response(buffer, {
            headers: {
                'Content-Type': 'image/png',
                'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-card.png"`
            }
        });
    } catch (error) {
        console.error('Error generating movie card:', error);
        return json({ error: 'Failed to generate movie card' }, { status: 500 });
    }
}; 