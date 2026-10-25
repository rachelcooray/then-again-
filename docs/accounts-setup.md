# Switching on accounts and the admin pages

Until these steps are done, sign-in and the admin pages run as a preview: no email is sent, nothing
leaves the phone, and admin decisions stay in the browser. About an hour in total.

## 1. Supabase project (free to start)

1. Create a project at supabase.com. Pick the region closest to most players (London for the UK).
2. In the SQL editor, run each file in `supabase/migrations/` in date order.
3. Project Settings > API: copy the **Project URL** and the **anon public** key.
4. In GitHub: repository Settings > Secrets and variables > Actions > Variables. Add
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with those values, then re-run the Pages deploy.
   (The anon key is meant to be public; the database rules decide what it can do.)

The free plan pauses a project after a week with no traffic. Once players use it daily that won't
happen, but move to Pro ($25 a month) before a public launch for backups and no pausing.

## 2. Sign-in emails with a code

1. Authentication > Providers > Email: keep it on; turn off "Confirm email" (the code confirms it).
2. Authentication > Email Templates > Magic Link: replace the body with a code, for example:

   ```html
   <h2>Your Then Again code</h2>
   <p>Enter this code in the app: <strong>{{ .Token }}</strong></p>
   <p>It works for an hour. If you didn't ask for it, you can ignore this email.</p>
   ```

3. Supabase's own email sender is only for testing and sends very few emails an hour. Set up a
   sender such as Resend (free for 3,000 emails a month, 100 a day): verify your domain there,
   then Project Settings > Authentication > SMTP Settings with Resend's SMTP details.
4. Authentication > URL Configuration: set the Site URL to `https://rachelcooray.github.io/then-again-/`.

## 3. Google sign-in (free)

1. At console.cloud.google.com, create a project, set up the OAuth consent screen (app name,
   support email, privacy policy link), and create an OAuth client ID of type "Web application".
2. Add the authorised redirect URI Supabase shows under Authentication > Providers > Google.
3. Paste the client ID and secret into that Google provider in Supabase and turn it on.

For the iPhone app, Apple requires "Sign in with Apple" alongside Google. That is part of the
native app work and uses the Apple developer account you need anyway.

## 4. Make yourself an admin

1. Sign in once in the app with your own email.
2. In the SQL editor:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

3. Open `#/admin` in the app. Anyone else who opens it is told the page is for the team.
