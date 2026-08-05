# JAMA Protection Services — Website

A responsive marketing site with a moderated client-reviews system and a
"Request a Quote" form. Plain HTML/CSS/JS — no build step, so it deploys
straight to GitHub Pages.

```
index.html          Main site (Home, About, Services, Reviews, Quote, Contact)
admin.html           Staff-only login + review moderation console
css/styles.css        Design system + all site styles
css/admin.css          Admin console styles
js/main.js             Nav, scroll effects, animations
js/reviews.js           Loads approved reviews, submits new ones
js/quote.js             Sends the quote form to Formspree
js/admin.js              Admin auth + approve/reject logic
js/supabase-config.js     ← your project keys go here
supabase/schema.sql      Database + security policies (run once in Supabase)
assets/img/                Logo + photography
```

## 1. What you need to set up (both free)

The site itself is static, but two things need external accounts because a
GitHub Pages site can't run its own server or store a database:

| Feature | Service | Why |
|---|---|---|
| Reviews + admin login | [Supabase](https://supabase.com) | Free Postgres database + authentication, with row-level security so only approved reviews are public and only your admin login can approve/reject |
| Quote request emails | [Formspree](https://formspree.io) | Free form-to-email relay — no backend needed |

Until you connect these, the site still works and looks complete — reviews
show sample content and the quote form tells the visitor to call instead.

## 2. Supabase setup (reviews + admin login)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the entire contents of
   `supabase/schema.sql`, and click **Run**. This creates the `reviews`
   table and the security rules described below.
3. Go to **Authentication → Users → Add user** and create the login you
   (the admin) will use — an email and a password.
4. Copy that user's **UUID** from the Users table, then run this in the
   SQL Editor (replace both values):
   ```sql
   insert into public.admins (user_id, email)
   values ('paste-the-user-uuid-here', 'admin@jamaprotection.co.za');
   ```
   This step is what actually grants moderation access — creating the
   login alone is not enough, on purpose (see **Security model** below).
5. Go to **Project Settings → API** and copy your **Project URL** and
   **anon / public key**.
6. Open `js/supabase-config.js` and paste them in:
   ```js
   const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```

You can add more admins later by repeating steps 3–4 for each staff member.

## 3. Formspree setup (quote request emails)

1. Create a free account at [formspree.io](https://formspree.io) using the
   business email that should receive quote requests
   (`info@jamaprotection.co.za`).
2. Create a new form and copy its endpoint, e.g. `https://formspree.io/f/abcd1234`.
3. Open `js/supabase-config.js` and paste it in:
   ```js
   const FORMSPREE_ENDPOINT = 'https://formspree.io/f/abcd1234';
   ```
4. Formspree will send a confirmation email the first time someone submits
   the form — confirm it once so future submissions go straight through.

## 4. Preview it locally before publishing

Any static file server works, for example with Python installed:
```bash
cd jama
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

## 5. Publish to GitHub Pages

1. Create a new repository on GitHub and push this folder to it:
   ```bash
   cd jama
   git init
   git add .
   git commit -m "JAMA Protection Services website"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Source → Deploy from a branch**, pick
   `main` and `/ (root)`, then **Save**.
3. Your site will be live at `https://YOUR-USERNAME.github.io/YOUR-REPO/`
   within a minute or two.

If you'd rather use a custom domain (e.g. `www.jamaprotection.co.za`), add
a `CNAME` file with that domain and point your DNS `A`/`CNAME` records to
GitHub Pages per [GitHub's custom domain docs](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site).

## 6. Security model — how the database is protected

Everything here is enforced **server-side** by Supabase's Row Level
Security (RLS), not by anything in the JavaScript — so it can't be
bypassed by editing the page or reading the source:

- **Anonymous visitors** can only *insert* a review with `status='pending'`,
  and can only *read* reviews with `status='approved'`. They can never
  read pending/rejected reviews, and can never insert a review that's
  already approved.
- **The admin console** only works for a Supabase-Auth user who *also* has
  a row in the `admins` table. A stolen or guessed password alone isn't
  enough — and you can revoke an admin instantly by deleting their row
  from `admins` (Authentication doesn't need to change).
- The key in `js/supabase-config.js` is the **anon/public key**, which is
  designed to be exposed in front-end code — it only ever grants what the
  RLS policies above allow. **Never** put your Supabase **service_role**
  key in any file that ends up on GitHub or in the browser.
- `admin.html` is listed in `robots.txt`-style `noindex` meta tags so
  search engines won't index it, but the real protection is the RLS
  policy, not obscurity.

## 7. Customising content

- **Logo / photos**: replace files in `assets/img/` (keep the same
  filenames, or update the `<img src>` / CSS `url()` references).
- **Contact details**: search for the phone numbers/emails in
  `index.html` and `admin.html` and replace them.
- **Services & copy**: edit directly in `index.html` — each section is
  clearly commented (`<!-- ============ SERVICES ============ -->` etc).
- **Colours/fonts**: all defined once at the top of `css/styles.css`
  under `:root { ... }`.
