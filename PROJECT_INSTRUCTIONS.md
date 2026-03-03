# 🚀 PROJECT MANIFEST: Kisan Setu AI (Hackathon Edition)

**Team:** Forge | **Track:** AI for Rural Innovation & Sustainable Systems 

## 1. Vision & Problem Statement

**Problem:** Rural farmers face a "Knowledge-Action Gap" due to language barriers, low literacy, and complex digital interfaces, leading to significant yield loss.
**Solution:** A "zero-barrier" Multilingual Agentic OS that acts as a proactive Virtual Extension Officer accessible via WhatsApp Voice and Image. It evolves from a passive chatbot into an active agent using **Amazon Bedrock** to perform tasks and provide hyper-localized advice.

---

## 2. Technical Stack & Architecture

* 
**Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Shadcn UI.


* 
**Backend:** Spring Boot 3.x / Node.js orchestrated via **AWS Lambda**.


* 
**Database:** **Amazon RDS (PostgreSQL)** with **pgvector** for RAG and **PostGIS** for spatial data.


* **AI/ML (AWS Native):**
* 
**Amazon Bedrock (Claude 3.5 Sonnet):** Reasoning, diagnostics, and multi-agent orchestration.


* 
**Amazon Transcribe:** Multilingual Voice-to-Action (Marathi, Hindi, etc.).


* 
**Amazon Textract:** OCR for Soil Health Cards and government documents.


* 
**Amazon SageMaker:** Time-series forecasting for "Mandi-Predictor" and Geospatial monitoring.




* 
**Communication:** WhatsApp Business API / Amazon Pinpoint for a "Zero-UI" experience.



---

## 3. Core Innovation Pillars (The "Winning Edge")

A. The Multilingual Agentic Core 

* 
**Voice-to-Action:** Integrate **Amazon Transcribe** to convert Marathi and Hindi dialects into structured data for the AI Agent.


* 
**Reasoning over Rules:** Use **Amazon Bedrock** for context-aware reasoning (e.g., tailored fertilization plans) instead of static "if-then" logic.



B. "Sarkari-Mitra" & "Soil-Smart" OCR 

* 
**OCR Integration:** Use **Amazon Textract** to digitize physical **Soil Health Cards**.


* 
**Subsidy Matcher:** An agent that proactively matches farmer profiles to **2026 Bharat Vistaar** government schemes.



C. Predictive Intelligence (Mandi-Predictor) 

* 
**Market Forecasting:** Implement a dashboard component that displays price trends using **Amazon SageMaker** time-series models.


* 
**Actionable Advice:** The AI must advise farmers whether to "Sell Now" or "Store" based on predicted peaks.



D. Proactive Satellite Alerts 

* 
**Early Warning System:** Integrate **AWS SageMaker Geospatial** data to send WhatsApp alerts for moisture stress or pest outbreaks before the farmer notices them.


---

4. 7-Day Sprint Roadmap (Feb 25 – Mar 4) 

* 
**Day 1-2: Infrastructure & Database:** Setup AWS RDS with `pgvector`, S3 for media, and the core Spring Boot/Lambda orchestration.


* 
**Day 3-4: Agent Intelligence:** Integrate Bedrock (Claude 3.5) for RAG and setup Transcribe/Textract for voice and image processing.


* 
**Day 5: Predictive & Proactive Logic:** Build the SageMaker forecasting models and Geospatial alert triggers.


* 
**Day 6: WhatsApp Integration & Handshake:** Connect the WhatsApp Business API and finalize the "Zero-UI" flow.


* 
**Day 7: Polishing & Submission:** Record the demo video, finalize the project summary, and deploy the live prototype.



---

## 5. Cursor Agent Execution Rules

1. 
**Spec-Driven Development:** Adhere to `design.md` and `requirements.md` generated via AWS Kiro.


2. 
**Multilingual Support:** All AI outputs must be grounded in Marathi and Hindi.


3. 
**Scalable & Serverless:** Prioritize AWS Lambda and pay-as-you-go managed services to ensure cost-efficiency.


4. 
**Responsible AI:** Implement IAM and VPC guardrails and ensure all advice is grounded in verified agricultural datasets via RAG.



---

6. Final Submission Checklist 

* **Project Summary:** Concise explanation of the agentic architecture and features.
* **Demonstration:** YouTube/Drive link showcasing the WhatsApp-based functionality.
* **Codebase:** Clean, documented GitHub repository link.
* **Working Link:** A live URL to the working prototype/dashboard for testers.






