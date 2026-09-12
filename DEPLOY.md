# Deploying

The site is a standard Next.js app with no database, no server state and no
runtime secrets. Every route prerenders to static output, so it can go almost
anywhere — Vercel is simply the least work.

## Vercel, from the GitHub repo (recommended)

No CLI and no token needed.

1. On [vercel.com/new](https://vercel.com/new), import
   `marcuseden777-source/ZW-Nicole`.
2. Pick the branch `claude/wedding-gift-web-nt5hwe` (or merge it first and
   deploy the default branch).
3. Leave every build setting alone — Vercel detects Next.js, and the defaults
   (`next build`, output `.next`) are correct.
4. Add one environment variable:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | the final public URL, e.g. `https://zhiwei-and-nicole.com` |

   Share previews and the `Event` structured data both read it. Without it
   they fall back to `http://localhost:3000`, which makes the WhatsApp preview
   card wrong — set it before sending the link to anyone.

5. Set the Node version. **Settings → General → Node.js Version → 22.x.**
   Next 16 refuses to build on anything below 20.9, and a project left on an
   older default fails with nothing more useful than "a project or build
   error". `engines.node` and `.nvmrc` in this repository ask for the right
   one, but the project setting is what actually decides.

6. Deploy.

### Optional second variable

| Name | Value | Effect |
|---|---|---|
| `NEXT_PUBLIC_PHASE` | `invitation` or `keepsake` | Overrides `phase` in `content/wedding.ts` |

After the wedding, set it to `keepsake` and redeploy: the RSVP is replaced by
the photo gallery and the guest messages, on the same URL. No code change.

## When a build fails

The email Vercel sends says only "a project or build error" and carries no
detail. The log does. Open the failed deployment, and read from the first red
line — everything above it is noise.

Three things account for most of it:

| What you see | What it is |
|---|---|
| `Node.js version >= v20.9.0 is required` | The project is on an old Node. Settings → General → Node.js Version → 22.x, then redeploy. |
| A build that fails where nothing changed | A poisoned build cache. Redeploy with **Use existing Build Cache unchecked**. |
| `Module not found` for something you never imported | `package-lock.json` out of step with `package.json`. Run `npm install` locally, commit the lockfile. |

To rule the code in or out before touching any settings, build it the way
Vercel does — from a clean copy, not your working directory:

```bash
git clone --branch claude/wedding-gift-web-nt5hwe \
  https://github.com/marcuseden777-source/ZW-Nicole.git check
cd check && npm ci && npx next build
```

If that passes and Vercel still fails, the difference is the environment, not
the repository.

## Vercel, from the CLI

Only if you would rather not connect the repo:

```bash
npm i -g vercel
vercel login
vercel --prod
```

## Anywhere else

```bash
npm ci
npm run build
npm start          # node server on $PORT
```

Nothing in the app requires Vercel specifically. The security and cache
headers live in `next.config.ts`, not in a platform config file, so they
travel with the app.

## Before you send the link out

- [ ] `NEXT_PUBLIC_SITE_URL` set to the real domain
- [ ] Open the link in WhatsApp or iMessage and check the preview card renders
- [ ] Open it on an actual iPhone and an actual Android — the landing film is
      the one thing that behaves differently per device
- [ ] Decide on indexing: the site ships `noindex` (a private celebration).
      To make it findable, flip `robots` in `app/layout.tsx`.
