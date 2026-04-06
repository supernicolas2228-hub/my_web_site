import fs from "fs";
import path from "path";
import pngToIco from "png-to-ico";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const svgPath = path.join(root, "public", "favicon.svg");
const svg = fs.readFileSync(svgPath);

await sharp(svg).resize(512, 512).png().toFile(path.join(root, "app", "icon.png"));
await sharp(svg).resize(180, 180).png().toFile(path.join(root, "app", "apple-icon.png"));
await sharp(svg).resize(32, 32).png().toFile(path.join(root, "public", "favicon-32.png"));

const buf48 = await sharp(svg).resize(48, 48).png().toBuffer();
const buf32 = await sharp(svg).resize(32, 32).png().toBuffer();
const buf16 = await sharp(svg).resize(16, 16).png().toBuffer();
const ico = await pngToIco([buf48, buf32, buf16]);
fs.writeFileSync(path.join(root, "public", "favicon.ico"), ico);

console.log("icons: app/icon.png, app/apple-icon.png, public/favicon-32.png, public/favicon.ico");
