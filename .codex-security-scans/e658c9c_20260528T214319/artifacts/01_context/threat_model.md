# LUMI Repository Threat Model

## Overview

LUMI is a static GitHub Pages site for a children's party decoration rental business serving Curitiba and Pinhais. The public site (`index.html`, `js/main.js`, `css/style.css`, and image assets) presents marketing content, theme cards, and outbound WhatsApp/Instagram links. Runtime data can come from local static defaults in `js/themes.js`, browser `localStorage`, or a Firebase Firestore project configured in `js/firebase-config.js`.

The main privileged surface is `admin.html`, a browser-side administration dashboard for creating, editing, importing, exporting, deleting, and seeding theme catalog records. In Firebase mode it uses Firebase Auth and Firestore from client-side JavaScript. In offline/demo mode it uses a hard-coded local password and stores edits in browser storage only. There is no repository-owned server-side code, API, build system, CI logic, or backend authorization layer in this checkout.

Important assets are the integrity of the public theme catalog, Firebase project data, Firebase authentication state, customer-facing brand content, any uploaded or imported theme images, and the confidentiality of Firebase administrative credentials and user sessions. Customer conversations and payments happen outside the repository through WhatsApp/Instagram links, so this code mainly protects catalog integrity and the trustworthiness of content shown to visitors.

## Threat Model, Trust Boundaries, and Assumptions

The public visitor boundary is the static web page served by GitHub Pages. Visitors can interact with navigation, filters, outbound links, and any catalog content fetched from Firestore or browser storage. They cannot directly execute repository code except through browser interpretation of HTML, CSS, and JavaScript.

The admin boundary is `admin.html`. In Firebase mode, the intended trust boundary is Firebase Authentication plus Firestore Security Rules, which are not stored in this repository. This means repository-side security must assume that client-side checks are not authoritative and that Firestore rules must enforce who can read or write catalog documents. In local demo mode, the hard-coded `admin123` password only gates a local browser dashboard and does not protect any shared backend asset.

Operator-controlled inputs include admin form fields such as title, category, age range, image URL, uploaded image files, imported JSON backups, reset/seed actions, and Firebase credentials. Attacker-controlled inputs include any Firestore documents writable by an attacker, imported JSON opened by an operator, theme image URLs, browser storage modified by local users or extensions, URL/navigation interactions, and third-party script responses from Firebase and CropperJS CDNs. Developer-controlled inputs include static assets, checked-in HTML/CSS/JS, default theme definitions, and deployment settings.

Key assumptions: GitHub Pages serves static files over HTTPS; Firebase SDK scripts and CDN scripts are loaded from their upstream origins; Firebase API keys in web apps are identifiers rather than secrets but still identify the backend project; Firestore rules and Firebase Auth configuration must provide real authorization; and users treat WhatsApp/Instagram links as external flows outside this repository's control.

## Attack Surface, Mitigations, and Attacker Stories

The highest-value attack surface is catalog content rendered through `innerHTML` in `js/main.js` and `admin.html`. The public renderer escapes theme titles and age ranges before interpolation, but it places theme image values directly into `img src` attributes. The admin dashboard escapes several displayed text fields, but also renders images, preview markup, and action handlers using stored values. Any Firestore or imported/local data path that reaches these sinks needs exact validation and escaping review.

Firebase access is security-critical. `js/firebase-config.js` initializes Firestore and Auth entirely in browser code, so the repository cannot rely on UI login state to protect writes. A realistic attacker story is an unauthenticated or low-privilege user writing malicious or brand-damaging theme records if Firestore rules permit it. A related story is an attacker abusing public read/write rules to overwrite catalog data or store unexpectedly large data URLs.

Admin import/upload flows are operator-assisted attack surfaces. A malicious backup JSON could supply crafted theme fields, huge base64 images, or hostile external image URLs. Uploaded images are processed client-side with CropperJS, which reduces some data size/format issues after cropping, but imported JSON and URL-based images remain relevant. The app does not process files server-side in this repository, so classic server-side file upload vulnerabilities are out of scope here.

Third-party dependencies are loaded directly from CDNs: Firebase SDKs from `www.gstatic.com` and CropperJS from `cdnjs.cloudflare.com`. Compromise of those sources, lack of subresource integrity, or dependency version vulnerabilities could affect visitors or admins. Because this is a static site, there is no package-lock or server dependency tree in scope.

Existing mitigations include use of `rel="noopener noreferrer"` on external links, `encodeURIComponent` for WhatsApp message text, an `escapeHTML` helper for text inserted into HTML templates, Firebase Auth in admin mode, and clear fallback separation between Firebase mode and local demo mode. Important missing repository-side controls include a Content Security Policy, explicit validation of URL schemes before inserting image URLs into markup, subresource integrity for CDN scripts, and checked-in Firestore rule evidence.

## Severity Calibration (Critical, High, Medium, Low)

Critical issues would require compromise beyond normal catalog integrity, such as a repository change that steals Firebase admin sessions at scale, a proven XSS reachable by every public visitor from remotely writable Firestore content, or client-side code that exposes a real secret capable of bypassing Firebase authorization. Since there is no backend server or payment flow in this checkout, server RCE, SSRF, and SQL injection are not realistic repository-context critical classes.

High issues include unauthenticated or improperly authorized Firestore writes to production catalog data, stored XSS in theme fields that can execute for public visitors or authenticated admins, or dependency/script-loading choices that allow practical script substitution in normal deployment. High severity requires a real remote path into shared data or visitor/admin execution, not only localStorage tampering by the same browser user.

Medium issues include admin-only XSS through imported JSON, malicious image URL handling that affects an operator or admin session, weak local demo authentication that could confuse operators if deployed as production protection, or missing CSP/SRI that increases impact of another content injection or supply-chain issue. These matter but usually require operator action, misconfiguration, or another boundary failure.

Low issues include cosmetic content manipulation confined to one browser's localStorage, public exposure of Firebase web configuration values by itself, external link hygiene issues without token leakage, and denial-of-service effects limited to large local imports in a single browser session. These are worth noting but do not by themselves compromise shared backend data or other users.
