# Setting Up Zoho Mail with Vercel for FreelanceShield

This guide will walk you through setting up Zoho Mail to work with your FreelanceShield waitlist functionality on Vercel.

## Prerequisites

1. A Zoho Mail account with your domain (freelanceshield.xyz) set up
2. Access to your Vercel project dashboard

## Step 1: Generate an App-Specific Password in Zoho

For security reasons, Zoho requires an app-specific password for third-party applications:

1. Log in to your Zoho Mail account
2. Go to Account Settings > Security
3. Under "App Passwords", click "Generate New Password"
4. Name it something like "FreelanceShield Waitlist"
5. Copy the generated password (you'll only see it once)

## Step 2: Configure Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your FreelanceShield project
3. Navigate to "Settings" > "Environment Variables"
4. Add the following environment variables:

| Name | Value | Description |
|------|-------|-------------|
| `ZOHO_EMAIL` | your-email@freelanceshield.xyz | Your Zoho email address |
| `ZOHO_PASSWORD` | your-app-specific-password | The app-specific password generated in Step 1 |
| `ZOHO_SMTP_HOST` | smtp.zoho.com | Zoho's SMTP server address |
| `ZOHO_SMTP_PORT` | 465 | SMTP port for secure connections |
| `ZOHO_SMTP_SECURE` | true | Use secure connection (TLS) |
| `WAITLIST_EMAIL_SUBJECT` | Welcome to FreelanceShield Waitlist! | Subject line for welcome emails |
| `WAITLIST_FROM_NAME` | FreelanceShield Team | Display name for emails |

5. Click "Save" to apply the changes

## Step 3: Redeploy Your Application

After setting up the environment variables, redeploy your application:

1. Go to the "Deployments" tab in your Vercel project
2. Click "Redeploy" on your latest deployment (or push a new commit to trigger a deployment)

## Testing the Setup

To test if your Zoho mail integration is working:

1. Visit your waitlist page at freelanceshield.xyz
2. Submit your email address to the waitlist form
3. Check if you receive the welcome email
4. Also verify that the admin notification email is sent to your Zoho inbox

## Troubleshooting

If emails are not being sent:

1. Check Vercel logs for any errors
2. Verify that all environment variables are set correctly
3. Ensure your Zoho account has SMTP access enabled
4. Try using a different port (587) if 465 doesn't work
5. Check if your Zoho account has any sending limits or restrictions

## Security Considerations

- Never commit your Zoho password or app-specific password to your repository
- Use environment variables for all sensitive information
- Regularly rotate your app-specific password for enhanced security
