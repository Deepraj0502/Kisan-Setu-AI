# Requirements Document

## Introduction

Kisan Setu AI is a multilingual agentic operating system designed to serve rural farmers through WhatsApp as a Zero-UI interface. The system acts as a proactive Virtual Extension Officer, providing government subsidy matching, market predictions, soil health management, and field monitoring through voice and image interactions.

## Glossary

- **Kisan_Setu_AI**: The complete multilingual agentic operating system for rural farmers
- **Sarkari_Mitra_Agent**: The RAG-based component that matches farmers with government subsidies
- **Mandi_Predictor**: The time-series forecasting component for market price predictions
- **Soil_Smart_OCR**: The OCR component that digitizes Soil Health Cards and generates fertilization plans
- **Field_Watch**: The satellite-based monitoring component for proactive field alerts
- **WhatsApp_Interface**: The primary communication channel using voice and image inputs
- **Virtual_Extension_Officer**: The AI agent that proactively assists farmers
- **Bharat_Vistaar**: The 2026 government subsidy program database
- **Soil_Health_Card**: Physical document containing soil analysis data
- **Land_Records**: Official documentation of farmer's land ownership and details
- **Fertilization_Plan**: 7-day schedule of fertilizer application recommendations
- **Moisture_Stress**: Condition when crops lack adequate water based on satellite data
- **Pest_Risk**: Probability of pest infestation based on environmental conditions

## Requirements

### Requirement 1: WhatsApp Voice Interface

**User Story:** As a rural farmer, I want to interact with the system using voice messages in my local language on WhatsApp, so that I can access agricultural services without needing to read or type.

#### Acceptance Criteria

1. WHEN a farmer sends a voice message in Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, or Odia, THE Kisan_Setu_AI SHALL transcribe it accurately using Amazon Transcribe
2. WHEN the system receives a transcribed voice message, THE Kisan_Setu_AI SHALL process the intent and respond with appropriate agricultural guidance
3. WHEN responding to farmers, THE Kisan_Setu_AI SHALL generate voice responses in the same language as the farmer's input
4. WHEN voice transcription fails or is unclear, THE Kisan_Setu_AI SHALL request clarification from the farmer in their preferred language
5. THE Kisan_Setu_AI SHALL maintain conversation context across multiple voice interactions within a session

### Requirement 2: WhatsApp Image Processing

**User Story:** As a rural farmer, I want to send images of my crops, soil health cards, or field conditions through WhatsApp, so that the system can analyze them and provide relevant advice.

#### Acceptance Criteria

1. WHEN a farmer sends an image of a Soil Health Card, THE Soil_Smart_OCR SHALL extract all text data using Amazon Textract
2. WHEN a farmer sends crop or field images, THE Kisan_Setu_AI SHALL analyze them using Amazon Bedrock vision capabilities
3. WHEN image processing is successful, THE Kisan_Setu_AI SHALL provide specific recommendations based on the visual analysis
4. IF image quality is insufficient for analysis, THEN THE Kisan_Setu_AI SHALL request a clearer image with specific guidance
5. THE Kisan_Setu_AI SHALL store processed images in Amazon S3 with appropriate farmer identification

### Requirement 3: Sarkari-Mitra Government Subsidy Matching

**User Story:** As a rural farmer, I want to discover relevant government subsidies from the 2026 Bharat Vistaar program based on my land records, so that I can access financial support for my farming activities.

#### Acceptance Criteria

1. WHEN a farmer provides land record information, THE Sarkari_Mitra_Agent SHALL retrieve matching subsidies from the Bharat_Vistaar database using RAG
2. WHEN multiple subsidies match a farmer's profile, THE Sarkari_Mitra_Agent SHALL rank them by relevance and potential benefit
3. WHEN presenting subsidy options, THE Sarkari_Mitra_Agent SHALL include eligibility criteria, application deadlines, and required documents
4. WHEN a farmer requests application guidance, THE Sarkari_Mitra_Agent SHALL provide step-by-step instructions in their preferred language
5. THE Sarkari_Mitra_Agent SHALL proactively notify farmers of new subsidies matching their profile within 24 hours of database updates

### Requirement 4: Mandi-Predictor Market Intelligence

**User Story:** As a rural farmer, I want to receive "Sell or Store" recommendations based on market price forecasts, so that I can maximize my crop revenue.

#### Acceptance Criteria

1. WHEN a farmer specifies their crop type and quantity, THE Mandi_Predictor SHALL generate price forecasts using time-series analysis
2. WHEN market conditions favor immediate sale, THE Mandi_Predictor SHALL recommend "Sell" with nearby mandi locations and expected prices
3. WHEN forecasts indicate price increases, THE Mandi_Predictor SHALL recommend "Store" with optimal selling timeline
4. WHEN providing recommendations, THE Mandi_Predictor SHALL include confidence levels and risk factors
5. THE Mandi_Predictor SHALL send proactive alerts when market conditions change significantly for stored crops

### Requirement 5: Soil-Smart OCR and Fertilization Planning

**User Story:** As a rural farmer, I want to digitize my physical Soil Health Card and receive a customized fertilization plan, so that I can optimize my soil management practices.

#### Acceptance Criteria

1. WHEN a Soil Health Card image is processed, THE Soil_Smart_OCR SHALL extract all nutrient values, pH levels, and soil composition data
2. WHEN soil data extraction is complete, THE Soil_Smart_OCR SHALL validate the data for completeness and accuracy
3. WHEN soil analysis is available, THE Soil_Smart_OCR SHALL generate a 7-day fertilization plan with specific fertilizer types and quantities
4. WHEN creating fertilization plans, THE Soil_Smart_OCR SHALL consider crop type, growth stage, and local weather conditions
5. THE Soil_Smart_OCR SHALL store digitized soil data in PostgreSQL with pgvector for similarity searches

### Requirement 6: Field-Watch Satellite Monitoring

**User Story:** As a rural farmer, I want to receive proactive alerts about moisture stress and pest risks in my fields based on satellite data, so that I can take preventive action before crop damage occurs.

#### Acceptance Criteria

1. WHEN satellite data indicates moisture stress in registered fields, THE Field_Watch SHALL send immediate WhatsApp alerts to affected farmers
2. WHEN environmental conditions suggest pest risk, THE Field_Watch SHALL notify farmers with specific pest types and recommended actions
3. WHEN generating alerts, THE Field_Watch SHALL include severity levels, affected field areas, and recommended response timelines
4. WHEN farmers receive alerts, THE Field_Watch SHALL provide actionable guidance including irrigation schedules or pest control measures
5. THE Field_Watch SHALL process satellite data updates every 6 hours and trigger alerts within 30 minutes of threat detection

### Requirement 7: Multilingual Natural Language Processing

**User Story:** As a rural farmer, I want the system to understand and respond in my local language, so that I can communicate naturally without language barriers.

#### Acceptance Criteria

1. THE Kisan_Setu_AI SHALL support Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and Odia languages
2. WHEN processing farmer inputs, THE Kisan_Setu_AI SHALL automatically detect the language and maintain consistency throughout the conversation
3. WHEN translating agricultural terms, THE Kisan_Setu_AI SHALL use region-specific terminology and local farming practices
4. WHEN language detection is uncertain, THE Kisan_Setu_AI SHALL ask farmers to specify their preferred language
5. THE Kisan_Setu_AI SHALL maintain language preferences in farmer profiles for future interactions

### Requirement 8: Proactive Virtual Extension Officer

**User Story:** As a rural farmer, I want the system to proactively provide timely agricultural guidance based on seasonal patterns and my farming activities, so that I don't miss critical farming decisions.

#### Acceptance Criteria

1. WHEN seasonal farming activities are due, THE Virtual_Extension_Officer SHALL send proactive reminders and guidance
2. WHEN weather patterns affect farming decisions, THE Virtual_Extension_Officer SHALL provide timely recommendations
3. WHEN crop growth stages require specific actions, THE Virtual_Extension_Officer SHALL alert farmers with detailed instructions
4. WHEN government schemes have approaching deadlines, THE Virtual_Extension_Officer SHALL remind eligible farmers
5. THE Virtual_Extension_Officer SHALL learn from farmer interactions to improve proactive recommendations over time

### Requirement 9: Data Storage and Retrieval

**User Story:** As a system administrator, I want farmer data to be securely stored and efficiently retrievable, so that the system can provide personalized and consistent service.

#### Acceptance Criteria

1. THE Kisan_Setu_AI SHALL store all farmer profiles, land records, and interaction history in Amazon RDS PostgreSQL
2. WHEN storing vector embeddings for RAG operations, THE Kisan_Setu_AI SHALL use pgvector extension for efficient similarity searches
3. WHEN farmers access their historical data, THE Kisan_Setu_AI SHALL retrieve information within 2 seconds
4. THE Kisan_Setu_AI SHALL encrypt all sensitive farmer data at rest and in transit
5. WHEN data backup is required, THE Kisan_Setu_AI SHALL maintain automated daily backups with 30-day retention

### Requirement 10: System Integration and Orchestration

**User Story:** As a system architect, I want all components to work together seamlessly through proper orchestration, so that farmers receive a unified and reliable service experience.

#### Acceptance Criteria

1. THE Kisan_Setu_AI SHALL use AWS Lambda functions for all microservice components
2. WHEN complex workflows span multiple services, THE Kisan_Setu_AI SHALL orchestrate them using AWS Step Functions
3. WHEN service failures occur, THE Kisan_Setu_AI SHALL implement retry logic and graceful degradation
4. THE Kisan_Setu_AI SHALL maintain service availability of 99.5% during peak farming seasons
5. WHEN system load increases, THE Kisan_Setu_AI SHALL automatically scale Lambda functions to handle demand