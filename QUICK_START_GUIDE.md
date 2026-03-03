# Quick Start Guide - User Onboarding Flow

## Setup Complete! ✅

The database has been migrated and all tables are ready.

## Start the Application

### 1. Start Backend
```bash
cd backend
npm run dev
```

Backend will run on http://localhost:4000

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

Frontend will run on http://localhost:3000

## Test the Onboarding Flow

### Step 1: Open the App
Navigate to http://localhost:3000

### Step 2: Enter Phone Number
You'll see a phone number input screen.

Enter: `9876543210`

Click "सुरू करा" (Start)

### Step 3: Complete Onboarding (6 Questions)

**Question 1: Name**
```
Answer: राम पाटील
```

**Question 2: Village and District**
```
Answer: नाशिक, नाशिक जिल्हा
```

**Question 3: Land Size (hectares)**
```
Answer: 2.5
```

**Question 4: Land Type**
```
Answer: 1
(1 = Irrigated, 2 = Rainfed, 3 = Both)
```

**Question 5: Primary Crops**
```
Answer: कांदा, टोमॅटो
```

**Question 6: Current Season Crops**
```
Answer: कांदा
```

### Step 4: Onboarding Complete!
You'll see: "✅ नोंदणी पूर्ण! आता मी तुम्हाला वैयक्तिक सल्ला देऊ शकतो."

### Step 5: Ask Questions with Context
Now all your questions will include your profile context!

Try asking:
- "माझ्या कांद्याच्या पिकावर रोग आहे"
- "आज हवामान कसे आहे?"
- "कांद्याचा बाजार भाव काय आहे?"

## Features to Test

### 1. Crop Disease Detection
- Click "📸 पीक फोटो" button
- Upload a crop disease image
- Get AI-powered diagnosis

### 2. Smart Notifications
- Click "🔔 सूचना" button
- Get random relevant notifications
- Weather, market, pest, scheme alerts

### 3. Voice Features
- Click 🔊 next to any agent message
- Hear the response in voice
- Works in Marathi, Hindi, English

### 4. Language Switch
- Change language from dropdown
- All responses adapt to selected language

## Test Different Users

### User 1: Small Farmer
```
Phone: 9876543210
Name: राम पाटील
Location: नाशिक, नाशिक जिल्हा
Land: 2.5 hectares (irrigated)
Crops: कांदा, टोमॅटो
```

### User 2: Large Farmer
```
Phone: 9876543211
Name: सुरेश देशमुख
Location: पुणे, पुणे जिल्हा
Land: 10 hectares (both)
Crops: गहू, सोयाबीन, कापूस
```

### User 3: Hindi Speaker
```
Phone: 9876543212
Name: विजय कुमार
Location: इंदौर, इंदौर जिला
Land: 5 hectares (rainfed)
Crops: गेहूं, चना
```

## Verify Personalization

### Without Profile Context
If you don't enter phone number, responses are generic.

### With Profile Context
After onboarding, responses include:
- Your name
- Your location
- Your crops
- Your land type

Example:
```
Generic: "कांद्याच्या पिकावर अनेक रोग होऊ शकतात..."

Personalized: "राम जी, नाशिक भागात सध्या कांद्यावर पांढरा गंज सामान्य आहे. 
तुमच्या 2.5 हेक्टर सिंचित जमिनीवर..."
```

## API Testing

### Get Profile
```bash
curl http://localhost:4000/agent/profile/+919876543210
```

### Get Conversation History
```bash
curl http://localhost:4000/agent/history/+919876543210?limit=10
```

### Send Query with Context
```bash
curl -X POST http://localhost:4000/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "कांद्याच्या पिकावर रोग आहे",
    "language": "mr",
    "phone_number": "+919876543210"
  }'
```

## Database Verification

### Check Tables
```sql
SELECT * FROM farmer_profiles;
SELECT * FROM conversations ORDER BY created_at DESC LIMIT 10;
SELECT * FROM user_preferences;
SELECT * FROM notifications_sent;
```

### Check Specific User
```sql
SELECT * FROM farmer_profiles WHERE phone_number = '+919876543210';
SELECT * FROM conversations WHERE phone_number = '+919876543210' ORDER BY created_at;
```

## Troubleshooting

### Backend Not Starting
- Check if port 4000 is available
- Verify database connection in .env
- Check for TypeScript errors

### Frontend Not Starting
- Check if port 3000 is available
- Verify NEXT_PUBLIC_API_BASE_URL in .env.local
- Clear .next folder and restart

### Onboarding Not Working
- Check browser console for errors
- Verify backend is running
- Check network tab for API calls
- Verify database tables exist

### Context Not Applied
- Complete all 6 onboarding steps
- Check onboarding_completed = true in database
- Verify phone number format (+91XXXXXXXXXX)
- Check backend logs for errors

## Success Indicators

✅ Phone number accepted
✅ 6 onboarding questions completed
✅ "नोंदणी पूर्ण" message shown
✅ Profile saved in database
✅ Queries include personalized context
✅ Conversation history saved
✅ Notifications work
✅ Voice playback works
✅ Crop disease detection works

## Next Steps

1. Test with multiple users
2. Try different languages
3. Upload crop disease images
4. Check notifications
5. Test voice features
6. Review conversation history
7. Verify personalization

## Support

If you encounter issues:
1. Check backend logs
2. Check browser console
3. Verify database connection
4. Review API responses
5. Check documentation files

Enjoy your personalized farming assistant! 🌾
