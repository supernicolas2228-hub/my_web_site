import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const svgPath = path.join(root, "public", "favicon.svg");
const svg = fs.readFileSync(svgPath);

await sharp(svg).resize(512, 512).png().toFile(path.join(root, "app", "icon.png"));
await sharp(svg).resize(180, 180).png().toFile(path.join(root, "app", "apple-icon.png"));
await sharp(svg).resize(32, 32).png().toFile(path.join(root, "public", "favicon-32.png"));
console.log("icons: app/icon.png, app/apple-icon.png, public/favicon-32.png");
