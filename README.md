# System Wise LLC Website

Marketing website for **System Wise LLC** (systemwisellc.com): managed IT, network infrastructure, cloud, cybersecurity, automation, VoIP, web and IT consulting services.

It's a plain static site (HTML, CSS and a little vanilla JavaScript). There's no build step and nothing to install.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home page: hero, highlights, about, 8-service "Reel Flux" ribbon (drag/scroll, bends into a wave, settles flat), curved testimonial carousel, process, call to action |
| `about.html` | About Us: company story (est. 2021), mission, values, who we serve |
| `testimonials.html` | Curved, draggable testimonial carousel, all testimonials (5-star cards) and a "Leave a Review" prompt |
| `services.html` | Interactive 3D service ring (drag/swipe, autoplay, "What's included" panel with contact options), then all 8 services with a category filter |
| `contact.html` | Contact form. `contact.html?service=voip` pre-selects a service |
| `intake.html` | 5-step new client intake form (not indexed by search engines) |
| `privacy-policy.html` | Privacy Policy (linked in every footer and under the contact and intake forms) |
| `404.html` | "Page not found" page |

Shared files:

- `css/styles.css`: all styles, with brand colors defined as variables at the top
- `js/main.js`: mobile menu, services filter, contact form and intake form logic

## Run it locally

Open `index.html` in a browser, or serve the folder with any static server, for example:

```bash
npx serve .
```

## Before going live

1. **Phone number:** replace the placeholder `(000) 000-0000` / `tel:+10000000000` on every page.
2. **Email:** confirm `info@systemwisellc.com` is correct.
3. **Form submissions:** the contact and intake forms validate input but don't send it anywhere yet. Connect them to a form service such as [Formspree](https://formspree.io) or Netlify Forms. Look for the `TODO` comments in `js/main.js`.
4. **Testimonials:** the 10 testimonials on `index.html` and `testimonials.html` are **samples for design preview**. Replace them with real client reviews (with permission) and delete the yellow `sample-note` lines. Publishing invented reviews as real ones can violate FTC rules.
5. **Hero background video (optional):** in `index.html`, put your video link in the `data-src` attribute of `<video class="hero-bg__video">`. Both HLS streams (`.m3u8`) and `.mp4` files work; HLS loads `hls.js` automatically where needed. Until a link is added, an animated background is shown instead.
6. **Domain:** update `sitemap.xml` and `robots.txt` if the site won't live at `https://systemwisellc.com`.

## Deploy with GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages**, set **Source** to "Deploy from a branch", choose `main` and `/ (root)`, then save.
3. For the custom domain, enter `systemwisellc.com` under **Custom domain**, and point your DNS at GitHub Pages ([instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)). Turn on **Enforce HTTPS** once it's available.

The 404 page uses root paths (`/css/styles.css`), so it displays correctly on a custom domain but not at a `username.github.io/repo-name/` address.

## Security note

The intake form tells clients not to enter passwords, card numbers or Social Security numbers. Collect system access separately through a password manager after the service agreement is signed.
