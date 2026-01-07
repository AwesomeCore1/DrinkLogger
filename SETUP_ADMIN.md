# Admin Access Setup Instructions

## Security Fix Applied

The admin access has been secured with Firebase Authentication. The old URL-based secret system has been replaced with proper authentication.

## Setup Steps

### 1. Enable Firebase Authentication

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `drinklogger-36574214`
3. Navigate to **Authentication** in the left sidebar
4. Click **Get Started** if you haven't enabled it yet
5. Go to the **Sign-in method** tab
6. Enable **Email/Password** authentication
7. Click **Save**

### 2. Create an Admin User

1. In the Firebase Console, go to **Authentication**
2. Click on the **Users** tab
3. Click **Add User**
4. Enter an email address (e.g., `admin@example.com`)
5. Set a strong password
6. Click **Add User**

### 3. Deploy Firestore Security Rules

The security rules have been added to `firestore.rules`. To deploy them:

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init firestore

# Deploy the security rules
firebase deploy --only firestore:rules
```

### 3b. Mark Your Account As Admin (Required)

Firestore writes are now **admin-only** via a Firebase custom claim:

- Required claim: `admin: true`

You can set this claim using the Firebase Admin SDK from a trusted environment.

1. Create a service account key in Firebase Console → Project Settings → Service accounts.
2. Save it as `serviceAccountKey.json` (do not commit it).
3. Install the Admin SDK and run a small script:

```bash
npm install firebase-admin
node setAdminClaim.js <ADMIN_UID>
```

Example `setAdminClaim.js`:

```js
const admin = require('firebase-admin');

admin.initializeApp({
	credential: admin.credential.cert(require('./serviceAccountKey.json')),
});

const uid = process.argv[2];
if (!uid) throw new Error('Pass the UID: node setAdminClaim.js <UID>');

admin
	.auth()
	.setCustomUserClaims(uid, { admin: true })
	.then(() => {
		console.log('✅ Admin claim set');
		process.exit(0);
	})
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
```

After setting the claim, sign out/in again in the app to refresh the token.

### 4. Access the Admin Panel

1. Navigate to `/admin` on your site
2. Log in with the email and password you created in step 2
3. You'll be redirected to `/admin/dashboard` where you can manage drinks and logs

## What Changed

### Security Improvements

- ✅ **Firebase Authentication**: Proper email/password authentication instead of URL-based secrets
- ✅ **Protected Routes**: Admin dashboard only accessible to authenticated users
- ✅ **Firestore Security Rules**: Database writes are now restricted to admin users only (custom claim)
- ✅ **Login Page**: Clean, modern login interface at `/admin`
- ✅ **Logout Functionality**: Users can securely log out from the dashboard

### Files Modified/Added

- `src/firebase/config.ts` - Added Firebase Auth initialization
- `src/contexts/AuthContext.tsx` - Authentication context for managing auth state
- `src/app/layout.tsx` - Wrapped app with AuthProvider
- `src/app/admin/page.tsx` - New login page
- `src/app/admin/dashboard/page.tsx` - Authenticated admin dashboard (replaces old [secret] page)
- `firestore.rules` - Firestore security rules to prevent unauthorized writes

### Old Files to Remove

You can now safely remove the old admin page:
- `src/app/admin/[secret]/page.tsx` - No longer needed

## Security Notes

1. **Firestore Rules**: Make sure to deploy the security rules to prevent unauthorized database access
2. **Strong Password**: Use a strong password for the admin account
3. **Environment Variables**: The old `NEXT_PUBLIC_ADMIN_SECRET` environment variable is no longer needed
4. **Public Dashboard**: The main dashboard at `/` remains publicly accessible for viewing logs (as intended)

## Troubleshooting

### Can't Log In?

- Make sure Firebase Authentication is enabled in the Firebase Console
- Verify the email and password are correct
- Check the browser console for any error messages

### Database Writes Not Working?

- Ensure you're logged in
- Ensure your user has the `admin: true` custom claim
- Deploy the Firestore security rules using `firebase deploy --only firestore:rules`
- Check the Firebase Console logs for security rule violations
