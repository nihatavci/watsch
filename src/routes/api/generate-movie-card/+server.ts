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
            streamingLinks,
            overview,
            type
        } = await request.json();

        // Create canvas with 16:9 aspect ratio
        const width = 1200;
        const height = 675;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Create dark background
        ctx.fillStyle = '#0A0A0A';
        ctx.fillRect(0, 0, width, height);

        // Load and draw poster image
        const posterImage = await loadImage(poster);
        
        // Calculate poster dimensions (maintain aspect ratio)
        const posterHeight = height * 0.9; // 90% of height
        const posterWidth = posterHeight * (2/3); // Standard movie poster ratio
        const posterX = 60;
        const posterY = (height - posterHeight) / 2;

        // Draw poster with rounded corners
        ctx.save();
        ctx.beginPath();
        const radius = 12;
        ctx.roundRect(posterX, posterY, posterWidth, posterHeight, radius);
        ctx.clip();
        ctx.drawImage(posterImage, posterX, posterY, posterWidth, posterHeight);
        ctx.restore();

        // Add gradient overlay
        const gradient = ctx.createLinearGradient(posterX, 0, width, 0);
        gradient.addColorStop(0, 'rgba(10, 10, 10, 0)');
        gradient.addColorStop(0.4, 'rgba(10, 10, 10, 0.8)');
        gradient.addColorStop(1, 'rgba(10, 10, 10, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Content area
        const contentX = posterX + posterWidth + 60;
        let contentY = posterY + 40;

        // Title with year
        ctx.font = 'bold 48px Inter';
        ctx.fillStyle = '#ffffff';
        const titleText = `${title}${year ? ` (${year})` : ''}`;
        
        // Handle long titles
        const maxTitleWidth = width - contentX - 60;
        let titleLines = [];
        let words = titleText.split(' ');
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxTitleWidth) {
                currentLine += ' ' + word;
            } else {
                titleLines.push(currentLine);
                currentLine = word;
            }
        }
        titleLines.push(currentLine);

        // Draw title lines
        titleLines.forEach((line, index) => {
            ctx.fillText(line, contentX, contentY + (index * 56));
        });
        contentY += (titleLines.length * 56) + 20;

        // Metadata (Runtime, Rating, Type)
        ctx.font = '24px Inter';
        ctx.fillStyle = '#999999';
        let metaText = [];
        if (runtime) metaText.push(runtime);
        if (rating) metaText.push(`${rating}%`);
        if (type) metaText.push(type.toUpperCase());
        ctx.fillText(metaText.join(' • '), contentX, contentY);
        contentY += 40;

        // Overview
        if (overview) {
            ctx.font = '20px Inter';
            ctx.fillStyle = '#cccccc';
            const maxWidth = width - contentX - 60;
            const words = overview.split(' ');
            let line = '';
            let lines = [];

            for (const word of words) {
                const testLine = line + word + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth) {
                    lines.push(line);
                    line = word + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line);

            // Limit to 3 lines
            lines = lines.slice(0, 3);
            if (lines.length === 3) {
                lines[2] = lines[2].trim() + '...';
            }

            lines.forEach((line, index) => {
                ctx.fillText(line, contentX, contentY + (index * 28));
            });
            contentY += (lines.length * 28) + 40;
        }

        // Genres
        if (genre) {
            const genres = genre.split(', ');
            ctx.font = '18px Inter';
            let tagX = contentX;
            const tagPadding = 16;
            const tagSpacing = 10;
            const tagHeight = 32;
            
            for (const genreText of genres) {
                const textWidth = ctx.measureText(genreText).width;
                const tagWidth = textWidth + (tagPadding * 2);
                
                if (tagX + tagWidth > width - 60) break;

                // Tag background
                ctx.fillStyle = 'rgba(229, 9, 20, 0.15)';
                ctx.beginPath();
                ctx.roundRect(tagX, contentY - 24, tagWidth, tagHeight, 16);
                ctx.fill();
                
                // Tag text
                ctx.fillStyle = '#E50914';
                ctx.fillText(genreText, tagX + tagPadding, contentY);
                
                tagX += tagWidth + tagSpacing;
            }
        }

        // Add watermark
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '20px Inter';
        ctx.textAlign = 'right';
        ctx.fillText('watsch.tv', width - 40, height - 30);

        // Convert canvas to buffer
        const buffer = canvas.toBuffer('image/png');

        return new Response(buffer, {
            headers: {
                'Content-Type': 'image/png',
                'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-watsch.png"`
            }
        });
    } catch (error) {
        console.error('Error generating movie card:', error);
        return json({ error: 'Failed to generate movie card' }, { status: 500 });
    }
}; 