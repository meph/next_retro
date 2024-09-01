This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) and inspired by [RemoteRetro](https://github.com/stride-nyc/remote_retro).

## Getting Started

#### PostgreSQL

- Install [Homebrew](http://brew.sh/)
  - __Note:__ You'll be prompted to install the command-line developer tools. Do it.
- Install PostgreSQL via Homebrew:

```
$ brew install postgresql

  # (follow directions supplied by brew output upon successful installation)

$ createdb

# depending on how you installed postgres, this user may already exist
createuser -s postgres

# make sure you can log in to default database
$ psql -h localhost
```

- Add the following line to your `.env` file:
```
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/your_dbname?schema=public"
```

#### Google OAuth

- Authentication within Next Retro relies on Google OAuth using [NextAuth](https://next-auth.js.org/).
- To set this up, navigate to the Google API console and create a new project: https://console.developers.google.com/apis

Next, click on "Credentials" in the left sidebar nav. On the right hand side, click on the "Create Credentials" button and select "OAuth client ID".

**Settings**
- Application type: Web application
- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

Click on the Create button. Using the information Google provides, add the following lines to your .env:

```
GOOGLE_ID="<Client Id>"
GOOGLE_SECRET="<Client secret>"
NEXTAUTH_URL="http://localhost:3000"
```

For production, you need to generate a secret key for NextAuth. You can generate a secure secret using the following bash command:

```
$ openssl rand -base64 32
```

And add the result to the .env:

```
NEXTAUTH_SECRET="<Random secret>"
```

**Mailer**
- [Nodemailer](https://nodemailer.com/) is used to send emails
- To send emails from your account add following lines to your .env
  - __Note:__ if you use 2FA you have to [create app password](https://myaccount.google.com/apppasswords)

```
GMAIL_PASS="<Your password>"
GMAIL_EMAIL="<Your email>"
```

Finally, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Backup and Restore

### Backup

To create a backup of your PostgreSQL database, you can use the following command:

```
docker-compose exec db pg_dump -U myuser -d myapp > backup.sql
```

This command will create a backup of the `myapp` database and save it to a file named `backup.sql` in your current directory.

### Restore

To restore the database from a backup file, you can use the following command:

```
cat backup.sql | docker-compose exec -T db psql -U myuser -d myapp
```

This command will restore the `myapp` database from the `backup.sql` file.

### Notes

- Replace `myuser` with your actual PostgreSQL username.
- Replace `myapp` with your actual PostgreSQL database name.
- Ensure that the `db` service is running before executing these commands.
