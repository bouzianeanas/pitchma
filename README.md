# ⚽ PitchMA — Morocco Pitch Booking App

A full-stack mobile application for booking football (and other sports) pitches in Morocco.
Built with **React Native (Expo)** + **Node.js/Express** + **PostgreSQL**.

---

## 🗂️ Project Structure

```
pitch-app/
├── backend/           # Node.js REST API
│   ├── server.js      # Entry point
│   ├── schema.sql     # Full database schema
│   ├── routes/
│   │   ├── auth.js    # Auth, OTP, registration
│   │   ├── pitches.js # Browse & search pitches
│   │   ├── bookings.js # Create & manage bookings
│   │   └── manager.js  # Manager dashboard routes
│   ├── middleware/
│   │   └── auth.js    # JWT authentication
│   └── config/
│       └── db.js      # PostgreSQL connection
│
└── frontend/          # React Native (Expo) app
    ├── App.js         # Root entry
    └── src/
        ├── config/
        │   ├── api.js     # All API calls
        │   └── theme.js   # Colors, fonts, spacing
        ├── context/
        │   └── AuthContext.js
        ├── navigation/
        │   └── AppNavigator.js
        ├── components/
        │   └── PitchCard.js
        └── screens/
            ├── auth/
            │   ├── PhoneScreen.js
            │   ├── OTPScreen.js
            │   └── CompleteProfileScreen.js
            ├── HomeScreen.js
            ├── ExploreScreen.js
            ├── PitchDetailScreen.js
            ├── BookingScreen.js
            ├── BookingConfirmScreen.js
            ├── BookingDetailScreen.js
            ├── MyBookingsScreen.js
            ├── OpenGamesScreen.js
            ├── ProfileScreen.js
            └── manager/
                ├── ManagerDashboardScreen.js
                ├── ManagePitchesScreen.js
                ├── CreatePitchScreen.js
                ├── ManageAvailabilityScreen.js
                └── ManagerBookingsScreen.js
```

---

## 🚀 Getting Started

### 1. Clone and Setup

```bash
git clone your-repo
cd pitch-app
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
```

**Setup PostgreSQL database:**
```bash
psql -U postgres
CREATE DATABASE pitchapp;
\c pitchapp
\i schema.sql
```

**Start backend:**
```bash
npm run dev        # Development
npm start          # Production
```

Backend runs on: `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

**Configure API URL:**
Edit `src/config/api.js` line 5:
```js
// Replace with your computer's local IP (not localhost!)
'http://192.168.1.XXX:5000/api'
```
Find your IP: `ipconfig` (Windows) / `ifconfig` (Mac/Linux)

**Start app:**
```bash
npx expo start
# Scan QR code with Expo Go app on your phone
```

---

## ⚙️ Environment Variables (Backend)

Edit `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/pitchapp
JWT_SECRET=change_this_to_something_very_long_and_random

# SMS (OTP) - Choose one:
# Option 1: Twilio (international)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxxxx

# Image uploads (create free account at cloudinary.com)
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Commission rate (0.08 = 8%)
COMMISSION_RATE=0.08
```

---

## 📱 App Features

### Player Flow
1. **Login** via phone number + OTP SMS
2. **Browse** pitches on map or list view
3. **Filter** by city, sport, price, availability date
4. **View** pitch details, amenities, reviews, available slots
5. **Book** a slot with payment selection
6. **Manage** bookings (view, cancel)
7. **Review** after playing

### Manager Flow
1. **Dashboard** with today's bookings, earnings, stats
2. **Create pitches** with full details (photos, amenities, GPS)
3. **Manage availability** — add/remove/block individual slots
4. **Auto-generate** slots for date ranges (e.g., 08:00-22:00 for 2 weeks)
5. **Confirm or cancel** player bookings
6. **View earnings** and booking history

### Admin Flow (via API)
- Approve manager applications: `PATCH /api/manager/admin/applications/:id/approve`
- Approve pitches: `PATCH /api/manager/admin/pitches/:id/approve`

---

## 🔌 Key API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to phone |
| POST | `/api/auth/verify-otp` | Verify OTP, get token |
| GET | `/api/pitches` | List/search pitches |
| GET | `/api/pitches/:id` | Pitch details + slots |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings` | User's bookings |
| PATCH | `/api/bookings/:id/cancel` | Cancel booking |
| GET | `/api/manager/dashboard` | Manager stats |
| POST | `/api/manager/pitches` | Create pitch |
| POST | `/api/manager/pitches/:id/generate-slots` | Auto-generate slots |

---

## 🌍 Deployment

### Backend — Deploy to Railway / Render

**Railway:**
1. Go to railway.app → New Project → Deploy from GitHub
2. Add PostgreSQL database plugin
3. Set environment variables in dashboard
4. It auto-deploys on push

**Render:**
1. Go to render.com → New Web Service
2. Connect GitHub repo, set root to `/backend`
3. Build: `npm install`, Start: `node server.js`
4. Add PostgreSQL database
5. Set env vars

### Frontend — Build with Expo

**Install EAS CLI:**
```bash
npm install -g eas-cli
eas login
```

**Configure:**
```bash
cd frontend
eas build:configure
```

**Build for Android:**
```bash
eas build --platform android
# Downloads .apk or .aab for Play Store
```

**Build for iOS:**
```bash
eas build --platform ios
# Requires Apple Developer account ($99/year)
```

**Update API URL before building:**
Change `src/config/api.js` to your production backend URL.

---

## 💡 Customization Checklist

- [ ] Change app name from "PitchMA" to your brand name
- [ ] Update colors in `frontend/src/config/theme.js`
- [ ] Set commission rate in `.env` (`COMMISSION_RATE=0.08`)
- [ ] Add your Twilio credentials for real SMS
- [ ] Set up Cloudinary for pitch image uploads
- [ ] Create your first admin user in PostgreSQL:
  ```sql
  UPDATE users SET role = 'admin' WHERE phone = '+2120600000000';
  ```
- [ ] Change `JWT_SECRET` to a long random string in production
- [ ] Set `NODE_ENV=production` in production

---

## 🇲🇦 Morocco-Specific Notes

- Default currency is MAD (Moroccan Dirham)
- Phone normalization supports `+212` country code
- Default cities include Casablanca, Rabat, Marrakech, etc.
- French is the default language (Arabic support ready via `preferred_language`)
- CMI payment gateway listed as option (requires CMI integration)

---

## 📞 Support

If you need to extend this app with:
- 💳 Real CMI payment integration
- 📸 Full image upload workflow
- 🔔 Push notification service
- 📊 Advanced analytics dashboard
- 🗺️ Better map clustering

...simply ask and the code can be extended!
