# AI Label Tool

The app has a single page: choose an MP4 or MOV, then add or remove its AI provenance label and download a copy. It runs entirely in the browser. Removal strips the top-level `uuid` boxes that carry the label; addition appends a C2PA-style `uuid` box with an unsigned AI-generated marker. The video and audio streams are copied byte-for-byte; nothing is uploaded and the file never leaves your computer.

## Live site

[https://devv-shayan.github.io/ai-label-tool/](https://devv-shayan.github.io/ai-label-tool/)

The site is deployed from `public/` by the GitHub Actions workflow in `.github/workflows/pages.yml`. The canonical URL, Open Graph tags, structured data, sitemap, and robots file all use this address.

## SEO notes

- `public/index.html` contains the search title and description, canonical URL, robots meta tag, Open Graph and Twitter cards, `SoftwareApplication`/`WebSite`/`FAQPage` JSON-LD, and the crawlable guide and FAQ content.
- `public/sitemap.xml` lists the canonical page for Google Search Console.
- `public/robots.txt` allows crawling and points to the sitemap. GitHub Pages serves it under the project path; the page's `index, follow` meta tag is the primary indexation control.
- `public/og-image.png` and the favicon files are the social and search icons.
- If the site moves to a custom domain, replace `https://devv-shayan.github.io/ai-label-tool/` in `public/index.html`, `public/sitemap.xml`, and `public/robots.txt`, then update the repository's GitHub Pages custom domain setting.

To make Google discover the page, verify the URL-prefix property in [Google Search Console](https://search.google.com/search-console/) and submit `https://devv-shayan.github.io/ai-label-tool/sitemap.xml`. Search Console verification is the one step that needs the site owner's account.

## Run it

1. Open Terminal in this folder.
2. Run `npm start`.
3. Open [http://127.0.0.1:8787](http://127.0.0.1:8787).

No package install is required. Node is the only runtime dependency; FFmpeg is not needed.

## How removal works

The page rewrites top-level `uuid` boxes in place: each box is relabeled as a skippable `free` box and its payload is zeroed, while every other byte keeps its exact position. That keeps the `moov` chunk offsets valid, so the output always stays playable. Files without a `uuid` box come out byte-identical.

## How adding works

Add mode appends one top-level `uuid` box with the standard C2PA user type and a small JUMBF JSON payload. Appending keeps every existing media offset unchanged, so the original video and audio bytes are untouched and the result stays playable.

The marker is unsigned, so it is a local test label rather than a verifiable Content Credential. C2PA validators will not accept it as proof of origin. Files that already contain a `uuid` label are downloaded unchanged instead of being labeled twice.

## Server

`server.mjs` is a local static server for `public/`. It serves the tool page, SEO files, social image, favicons, the self-hosted Inter font, and its license. All processing happens in the browser. The self-hosted Inter font is licensed under the SIL Open Font License; see `public/fonts/OFL.txt`.
