# 🌾 Kisan Setu AI - Multilingual Agricultural Assistant

> **Breakthrough Feature:** Satellite-based proactive monitoring that alerts farmers BEFORE problems become visible!

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL with pgvector + PostGIS
- AWS Account (Bedrock, Polly, SageMaker Geospatial)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/kisan-setu-ai.git
cd kisan-setu-ai

# Backend setup
cd backend
npm install
cp .env.example .env  # Configure your environment variables

# Run migrations
npm run migrate:db
npm run migrate:rag
npm run migrate:profiles
npm run migrate:geospatial

# Start backend
npm run dev

# Frontend setup (new terminal)
cd ../frontend
npm install
cp .env.local.example .env.local  # Configure API URL

# Start frontend
npm run dev
```

### Access
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Health Check: http://localhost:4000/health

## 🌟 Key Features

### 1. 🛰️ Satellite-Based Proactive Monitoring (NEW!)
- Monitors farmer land via Sentinel-2 satellite (10m resolution)
- Detects moisture stress, crop health decline, pest outbreaks
- Sends WhatsApp alerts BEFORE farmer notices issues
- 5-10 days advance warning
- Cost: ~$3 per farmer per month

### 2. 🗣️ Multilingual Voice Interface
- Voice input in Marathi, Hindi, English
- AWS Polly text-to-speech output
- Per-message voice playback

### 3. 📸 Crop Disease Detection
- AI-powered image analysis (Claude 3.5 Sonnet Vision)
- Instant diagnosis with treatment recommendations
- Multilingual responses

### 4. 👤 Personalized User Profiles
- 6-step progressive onboarding
- Context-aware responses
- Conversation history

### 5. 🏛️ Government Scheme Eligibility
- Automatic eligibility checking for 6+ schemes
- Step-by-step application guidance
- Multilingual scheme information

### 6. 🌦️ Real-Time Data Integration (NEW!)
- Automatic weather data in responses (Open-Meteo API)
- Live market prices from government mandis (data.gov.in)
- Government scheme information
- Context-aware data fetching based on query intent
- Multilingual data formatting

### 7. 🔔 Smart Notifications
- Weather, market, pest, scheme, irrigation, harvest alerts
- 6 categories with 5+ variations each
- Emoji-enhanced, actionable content

### 8. 💬 Rich Text Formatting
- Bold text, bullet points, numbered lists
- WhatsApp-style chat interface
- Image display in chat

### 9. 🧠 RAG-Based Knowledge System
- Vector similarity search with pgvector
- AWS Bedrock Claude for answer generation
- Contextual, verified agricultural advice

## 📊 Architecture

```
Frontend (Next.js)
    ↓
Backend (Express.js)
    ↓
┌─────────────┬──────────────┬─────────────────┐
│             │              │                 │
AWS Bedrock   AWS Polly   AWS SageMaker    PostgreSQL
(Claude AI)   (TTS)       Geospatial       (pgvector)
                          (Satellite)
```

## 📚 Documentation

- **[Complete Project Summary](PROJECT_COMPLETE_SUMMARY.md)** - Full technical documentation
- **[Geospatial Monitoring](SAGEMAKER_GEOSPATIAL_INTEGRATION.md)** - Satellite monitoring setup
- **[Geospatial Summary](GEOSPATIAL_MONITORING_SUMMARY.md)** - Breakthrough feature overview
- **[Real-Time Data Integration](CHATBOT_REALTIME_INTEGRATION.md)** - Weather & market price integration (NEW!)
- **[Real-Time Data APIs](REALTIME_DATA_INTEGRATION.md)** - API documentation
- **[Quick Start Guide](QUICK_START_GUIDE.md)** - Setup instructions
- **[User Onboarding Flow](USER_ONBOARDING_FLOW.md)** - User registration process
- **[Crop Disease Detection](CROP_DISEASE_DETECTION.md)** - Image analysis feature
- **[AWS Polly Integration](AWS_POLLY_INTEGRATION.md)** - TTS setup

## 🔧 Configuration

### Backend Environment Variables

```bash
# Database
DATABASE_URL=postgres://user:password@host:5432/dbname

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Bedrock
BEDROCK_CHAT_MODEL_ID=arn:aws:bedrock:ap-south-1:...:inference-profile/...
USE_BEDROCK_RAG=true

# SageMaker Geospatial (NEW!)
SAGEMAKER_EXECUTION_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT:role/SageMakerGeospatialRole
GEOSPATIAL_MONITORING_ENABLED=true
MONITORING_INTERVAL_HOURS=6

# Real-Time Data APIs (NEW!)
DATA_GOV_IN_API_KEY=your_api_key  # Get from https://data.gov.in
# Open-Meteo is FREE, no API key needed!

# Server
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

### Frontend Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_USE_AWS_POLLY=true
```

## 🛰️ Satellite Monitoring Setup

### 1. Register Land Parcel

```bash
curl -X POST http://localhost:4000/agent/land-parcel \
  -H "Content-Type: application/json" \
  -d '{
    "farmer_id": "uuid",
    "parcel_name": "Main Field",
    "boundary": {
      "type": "Polygon",
      "coordinates": [[[73.8567, 18.5204], [73.8577, 18.5204], [73.8577, 18.5194], [73.8567, 18.5194], [73.8567, 18.5204]]]
    },
    "area_hectares": 2.5,
    "current_crop": "onion"
  }'
```

### 2. Start Monitoring

```bash
# Manual trigger (testing)
curl -X POST http://localhost:4000/agent/run-monitoring

# Or enable automatic scheduling (every 6 hours)
# Set GEOSPATIAL_MONITORING_ENABLED=true in .env
```

### 3. Get Alerts

```bash
curl http://localhost:4000/agent/geospatial-alerts/farmer-uuid?language=mr
```

## 📱 API Endpoints

### Core Endpoints
- `POST /agent/query` - Main chat interface (now with real-time data!)
- `POST /agent/tts` - Text-to-speech
- `POST /agent/crop-disease` - Image analysis
- `POST /agent/sarkari-mitra` - Scheme eligibility
- `GET/PUT /agent/profile/:phone_number` - User profile
- `GET /agent/history/:phone_number` - Chat history

### Real-Time Data Endpoints (NEW!)
- `GET /agent/weather` - Current weather + 7-day forecast
- `GET /agent/market-prices` - Live mandi rates
- `GET /agent/schemes` - Government schemes

### Geospatial Endpoints
- `POST /agent/land-parcel` - Register land for monitoring
- `GET /agent/land-parcels/:farmer_id` - Get farmer's parcels
- `GET /agent/geospatial-alerts/:farmer_id` - Get pending alerts
- `POST /agent/run-monitoring` - Trigger monitoring job

## 🧪 Testing

### Setup Test Profile

Before running integration tests, create a test profile:

```bash
cd backend
npm run reset:test-profile
```

This creates a complete farmer profile for phone number `+919876543210` with:
- Name: Ramesh Patil
- Location: Nashik, Maharashtra
- Land: 2.5 hectares (irrigated)
- Crops: Onion, Tomato

### Run Integration Tests

```bash
cd backend
npm run test:chatbot-integration
```

Expected output: 10/10 tests passed ✅

### Test Real-Time Data Integration

```bash
# Weather query
curl -X POST http://localhost:4000/agent/query \
  -H "Content-Type: application/json" \
  -d '{"question":"आज हवामान कसे आहे?","language":"mr","phone_number":"+919876543210"}'

# Market price query
curl -X POST http://localhost:4000/agent/query \
  -H "Content-Type: application/json" \
  -d '{"question":"कांद्याचा भाव किती आहे?","language":"mr","phone_number":"+919876543210"}'

# Scheme query
curl -X POST http://localhost:4000/agent/query \
  -H "Content-Type: application/json" \
  -d '{"question":"शेतकऱ्यांसाठी काय योजना आहेत?","language":"mr","phone_number":"+919876543210"}'
```

### Manual Testing
1. Open http://localhost:3000
2. Enter phone number: +919876543210
3. Select language: Marathi
4. Complete onboarding (6 steps)
5. Ask questions in voice or text
6. Upload crop image for disease detection
7. Click notification button for alerts

### Test Satellite Monitoring
1. Register a land parcel (see above)
2. Trigger monitoring job
3. Check for generated alerts
4. Verify WhatsApp notification (if configured)

## 📈 Impact

### Expected Outcomes
- **Yield Improvement:** 15-20%
- **Water Savings:** 20-30%
- **Crop Loss Prevention:** 10-15%
- **Time Savings:** 5-10 hours/month per farmer

### Cost-Benefit
- **Cost:** $3.20 per farmer per month
- **Value:** $150-200 per farmer (yield improvement)
- **ROI:** 50-60x

## 🏆 Competitive Advantages

1. **Proactive Monitoring** - Satellite-based alerts before issues visible
2. **Zero-Barrier Interface** - WhatsApp-style, voice-first
3. **Multilingual** - Marathi, Hindi, English
4. **Personalized** - Context-aware responses
5. **Integrated** - Government schemes, disease detection, market data
6. **Affordable** - $3/month vs. traditional extension services

## 🔮 Roadmap

### Q2 2026
- [ ] Real WhatsApp Business API integration
- [x] Live weather data integration ✅
- [x] Real-time mandi price feeds ✅
- [ ] Mobile app (React Native)

### Q3 2026
- [ ] Predictive analytics (yield, prices)
- [ ] Drone imagery integration
- [ ] Soil health monitoring
- [ ] Community features

### Q4 2026
- [ ] Multi-state expansion
- [ ] More languages (Tamil, Telugu, Kannada)
- [ ] Financial services integration
- [ ] Supply chain connections

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is part of a hackathon submission for AI for Rural Innovation & Sustainable Systems track.

## 🙏 Acknowledgments

- **AWS Bedrock** - Claude 3.5 Sonnet, Titan Embeddings
- **AWS Polly** - Text-to-speech
- **AWS SageMaker Geospatial** - Satellite monitoring
- **PostgreSQL + pgvector** - Vector database
- **Sentinel-2** - Satellite imagery (ESA)

## 📞 Support

- GitHub Issues: [Repository Issues](https://github.com/your-org/kisan-setu-ai/issues)
- Email: support@kisansetu.ai
- Documentation: [Wiki](https://github.com/your-org/kisan-setu-ai/wiki)

---

**Built with ❤️ for Indian farmers by Team Forge**

**Last Updated:** March 3, 2026 | **Version:** 1.1.0


---

## 🚀 Deployment

### Current Deployment (Production)

**Live URLs:**
- Frontend: https://main.d29xa6wbhq5k45.amplifyapp.com
- Backend: https://kisan-setu-ai.duckdns.org

**Architecture:**
- Frontend: AWS Amplify (Next.js)
- Backend: AWS EC2 (Node.js + PM2 + Nginx + SSL)
- Database: AWS RDS PostgreSQL (pgvector + PostGIS)

**Cost:** ~$30-45/month

### Documentation
- 📖 **[Deployment Guide](DEPLOYMENT.md)** - Complete deployment documentation
- ⚡ **[Quick Commands](QUICK_COMMANDS.md)** - Common operations reference

### Maintenance

```bash
# Update backend
ssh -i your-key.pem ubuntu@13.201.127.127
cd /var/www/kisan-setu-backend
git pull && npm install && pm2 restart kisan-setu-backend

# Update frontend
git push origin main  # Auto-deploys via Amplify
```

---

## 📦 Project Structure

```
kisan-setu-ai/
├── backend/                    # Node.js + Express backend
│   ├── src/
│   │   ├── server.ts          # Main server
│   │   ├── services/          # Business logic
│   │   └── db/                # Database migrations
│   └── ecosystem.config.js    # PM2 configuration
├── frontend/                   # Next.js frontend
│   ├── app/
│   └── components/
│       ├── WhatsAppSimulator.tsx
│       └── SoilCardSample.tsx
├── amplify.yml                 # Amplify build config
├── DEPLOYMENT.md               # Deployment documentation
└── QUICK_COMMANDS.md           # Command reference
```

---

## 🔒 Security

- ✅ HTTPS/SSL with Let's Encrypt
- ✅ IAM roles for AWS services
- ✅ Security groups configured
- ✅ Database encryption at rest
- ✅ Environment variables secured
- ✅ CORS properly configured

---

**Built with ❤️ for Indian farmers**
