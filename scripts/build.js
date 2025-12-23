const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const FLASHCARDS_DIR = path.join(__dirname, '../flashcards');
const DIST_DIR = path.join(__dirname, '../dist');
const DATA_DIR = path.join(DIST_DIR, 'data');
const SRC_UI_DIR = path.join(__dirname, '../src/ui');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to copy directory recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

async function build() {
    console.log('Starting build...');

    // 1. Copy Frontend Assets
    console.log('Copying frontend assets...');
    copyDir(SRC_UI_DIR, DIST_DIR);

    // 2. Process CSVs
    console.log('Processing CSV files...');
    const files = fs.readdirSync(FLASHCARDS_DIR).filter(file => file.endsWith('.csv'));
    const chapters = [];

    for (const file of files) {
        const filePath = path.join(FLASHCARDS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        try {
            // Parse CSV
            // Headers: false (no header in file), columns: ['front', 'back'] manually?
            // The prompt says "No header; 1st col=front, 2nd col=back".
            // We use 'relax_quotes' or standard RFC4180.
            const records = parse(content, {
                columns: ['front', 'back'],
                skip_empty_lines: true,
                relax_column_count: true,
                trim: true
            });

            // Clean up data if necessary (e.g. handle undefined back if row is malformed)
            const cards = records.map((record, index) => ({
                id: index,
                front: record.front || '',
                back: record.back || ''
            })).filter(c => c.front || c.back);

            const slug = path.basename(file, '.csv')
                .toLowerCase()
                .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-') // Keep chinese chars safe or just use filename
                .replace(/^-+|-+$/g, '');

            // To allow Chinese characters in URLs properly or just use the filename as slug directly if filesystem supports it.
            // For web, it's safer to encodeURI or just keep the filename as the ID but maybe sanitize strictly for "slug".
            // Since the requirements say "slug", let's just use the filename itself as ID to avoid collision issues with complex chars,
            // but for the URL hash, we can use the encoded filename.

            // Let's rely on encodeURIComponent for the frontend, but for the file on disk:
            // generated file: dist/data/<slug>.json.
            // If I use chinese characters in filename, it works on most modern FS.
            // Let's use the exact filename (minus extension) as the slug key, but ensure the output filename is safe.
            // Actually, let's just use the filename as the slug.

            const rawSlug = path.basename(file, '.csv');
            const safeFilename = rawSlug; // We will save as "dist/data/ChapterName.json"

            const outputFilename = `${safeFilename}.json`;

            fs.writeFileSync(path.join(DATA_DIR, outputFilename), JSON.stringify(cards));

            chapters.push({
                title: rawSlug.replace(/_/g, ' '), // Replace underscores with spaces for display
                slug: safeFilename,
                count: cards.length
            });

            console.log(`Processed ${file}: ${cards.length} cards`);

        } catch (err) {
            console.error(`Error processing ${file}:`, err.message);
        }
    }

    // Sort chapters by title
    chapters.sort((a, b) => a.title.localeCompare(b.title));

    // Write chapters.json
    fs.writeFileSync(path.join(DATA_DIR, 'chapters.json'), JSON.stringify(chapters));
    console.log('Generated chapters.json');

    console.log('Build complete!');
}

build();
