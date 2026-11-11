# InfluenceAI --- AI-Powered Influencer Discovery & Outreach Platform

> An AI-powered SaaS platform for discovering relevant influencers,
> matching creators to brand campaigns using Hybrid RAG, generating
> personalized outreach, and sending human-approved email campaigns.

## Overview

InfluenceAI brings influencer discovery, AI matching, campaign
management, and outreach into one workflow.

Users can:

-   Browse an influencer database
-   Create brand campaigns
-   Define niche, location, follower, and engagement requirements
-   Retrieve relevant creators using hybrid retrieval
-   Rank candidates using an LLM
-   Generate personalized outreach messages
-   Review and approve AI-generated messages
-   Send approved emails through Gmail
-   Track outreach status from a SaaS dashboard

## Core Features

### Influencer Discovery

Creator profiles contain:

-   Name
-   Username
-   Platform
-   Niche
-   Location
-   Followers
-   Engagement rate
-   Average views
-   Profile URL

### Campaign Management

Campaigns support:

-   Brand name
-   Industry
-   Target niche
-   Target location
-   Minimum followers
-   Maximum followers
-   Minimum engagement
-   Campaign description

### Hybrid RAG Matching

The core matching pipeline combines:

**Structured filtering + semantic/vector retrieval + LLM evaluation**

This allows the system to use hard constraints while also understanding
semantic relevance.

### AI Ranking

Candidates receive:

-   Match score from 0--100
-   Recommendation
-   Reasons
-   Strengths
-   Concerns

Recommendation levels:

      Score Recommendation
  --------- ----------------
    80--100 Strong Match
     60--79 Good Match
     40--59 Moderate Match
      0--39 Low Match

### AI Outreach

The platform generates personalized collaboration messages using
campaign and influencer context.

### Human-in-the-Loop Email

Messages are reviewed before sending:

``` text
AI generates message
        ↓
User reviews
        ↓
User approves
        ↓
Gmail API
        ↓
Email sent
```

### SaaS Dashboard

The React frontend contains:

-   Dashboard
-   Influencers
-   Campaigns
-   Outreach

------------------------------------------------------------------------

# Architecture

## High-Level Architecture

``` mermaid
flowchart TB
    U[User / Marketer]

    subgraph FE[React SaaS Frontend]
        D[Dashboard]
        I[Influencers]
        C[Campaigns]
        O[Outreach]
        API[API Service]
    end

    subgraph BE[FastAPI Backend]
        R[API Router]
        CM[Campaign Matching API]
        IMS[Influencer Matching Service]
        HRS[Hybrid Retrieval Service]
        ES[Embedding Service]
        VS[Vector Search Service]
        OS[Outreach Service]
        GS[Gmail Service]
        AI[AI Chat / LLM Layer]
    end

    subgraph DB[Data Layer]
        PG[(PostgreSQL / Supabase)]
        PV[(pgvector)]
    end

    subgraph EXT[External AI & APIs]
        GEM[Gemini Embedding API]
        GROQ[Groq LLM]
        GF[Gemini LLM Fallback]
        YT[YouTube Data API]
        GMAIL[Gmail API]
    end

    U --> FE
    D --> API
    I --> API
    C --> API
    O --> API

    API --> R
    R --> CM
    R --> OS

    CM --> IMS
    IMS --> HRS
    IMS --> AI

    HRS --> VS
    HRS --> ES
    ES --> GEM
    VS --> PV
    VS --> PG

    AI --> GROQ
    AI -. fallback .-> GF

    OS --> GS
    GS --> GMAIL

    YT --> PG
    ES --> PG
```

## AI Matching Pipeline

``` mermaid
flowchart LR
    A[Campaign Requirements]
    B[Build Semantic Query]
    C[Hybrid Retrieval]
    D[Structured Filters]
    E[Vector Similarity]
    F[Candidate Pool]
    G[LLM Evaluation]
    H[Score + Recommendation]
    I[Ranked Matches]

    A --> B
    B --> C
    C --> D
    C --> E
    D --> F
    E --> F
    F --> G
    G --> H
    H --> I
```

## Outreach Pipeline

``` mermaid
flowchart LR
    A[Matched Influencer]
    B[Campaign Context]
    C[AI Message Generation]
    D[Draft]
    E[Human Review]
    F{Approved?}
    G[Gmail API]
    H[Sent]
    I[Rejected / Edited]

    A --> C
    B --> C
    C --> D
    D --> E
    E --> F
    F -->|Yes| G
    G --> H
    F -->|No| I
```

------------------------------------------------------------------------

# Technology Stack

  Layer                 Technology
  --------------------- ------------------------------------
  Frontend              React, Vite, JavaScript, CSS
  Backend               Python, FastAPI, Pydantic, Uvicorn
  Database              PostgreSQL / Supabase
  Vector Database       pgvector
  Embeddings            Gemini `gemini-embedding-001`
  Embedding Dimension   768
  Primary LLM           Groq
  Fallback LLM          Gemini
  Creator Data          YouTube Data API v3
  Email                 Gmail API
  Frontend Deployment   Vercel
  Backend Deployment    Render

------------------------------------------------------------------------

# Project Structure

``` text
Influencer_Outreach_AI/
│
├── BACKEND/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── router.py
│   │   │       └── endpoints/
│   │   ├── db/
│   │   │   ├── session.py
│   │   │   └── base.py
│   │   ├── models/
│   │   │   ├── influencer.py
│   │   │   ├── embedding.py
│   │   │   ├── campaign.py
│   │   │   └── outreach_message.py
│   │   ├── services/
│   │   │   ├── embedding_service.py
│   │   │   ├── embedding_storage_service.py
│   │   │   ├── hybrid_retrieval_service.py
│   │   │   ├── vector_search_service.py
│   │   │   ├── influencer_matching_service.py
│   │   │   ├── youtube_service.py
│   │   │   ├── influencer_dataset_service.py
│   │   │   ├── outreach_service.py
│   │   │   └── gmail_service.py
│   │   └── ai/
│   │       ├── models.py
│   │       ├── chat.py
│   │       └── prompts/
│   │           └── gemini_prompt.py
│   ├── credentials.json
│   ├── test_db.py
│   ├── test_models.py
│   └── test_gmail.py
│
├── FRONTEND/
│   ├── src/
│   │   ├── assets/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Campaigns.jsx
│   │   │   ├── Influencers.jsx
│   │   │   └── Outreach.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
│
├── .env
├── .gitignore
└── requirements.txt
```

------------------------------------------------------------------------

# Core Matching Architecture

The matching API starts in:

``` text
app/api/v1/endpoints/campaigns.py
```

The main orchestration is implemented in:

``` text
app/services/influencer_matching_service.py
```

The flow is:

``` text
Campaign API
     ↓
match_influencers_to_campaign()
     ↓
build_campaign_query()
     ↓
hybrid_search_influencers()
     ↓
Candidate Pool
     ↓
evaluate_influencer_matches()
     ↓
LLM Scoring
     ↓
Validation + Ranking
     ↓
Final Matches
```

The hybrid retrieval implementation is located in:

``` text
app/services/hybrid_retrieval_service.py
```

The LLM abstraction is located in:

``` text
app/ai/chat.py
```

------------------------------------------------------------------------

# Embedding Architecture

Influencer profiles are embedded using Gemini:

``` text
Influencer Profile
       ↓
Embedding Service
       ↓
Gemini Embedding API
       ↓
768D Embedding
       ↓
PostgreSQL + pgvector
```

During matching:

``` text
Campaign Query
       ↓
Gemini Embedding
       ↓
Query Vector
       ↓
pgvector Similarity Search
       ↓
Relevant Candidates
```

------------------------------------------------------------------------

# LLM Fallback Architecture

``` text
AI Request
    │
    ▼
Groq LLM
    │
    ├── Success ──→ Response
    │
    └── Failure
          ↓
      Gemini LLM
          ↓
       Response
```

The application supports streaming responses and retry delays of:

``` text
2s → 4s → 6s
```

------------------------------------------------------------------------

# API Endpoints

  Method   Endpoint                           Purpose
  -------- ---------------------------------- ------------------------
  GET      `/health`                          Backend health
  GET      `/api/v1/influencers/`             Retrieve influencers
  GET      `/api/v1/campaigns/`               Retrieve campaigns
  POST     `/api/v1/campaigns/`               Create campaign
  POST     `/api/v1/campaigns/{id}/match`     AI influencer matching
  GET      `/api/v1/outreach/campaign/{id}`   Retrieve outreach
  PATCH    `/api/v1/outreach/{id}/status`     Update outreach status
  POST     `/api/v1/outreach/{id}/send`       Send approved email

------------------------------------------------------------------------

# Example Matching Request

A campaign can contain requirements such as:

``` json
{
  "campaign_description": "Launching a fitness tracking app for young adults.",
  "product": "Fitness tracking app",
  "niche": "Fitness",
  "target_audience": "Young adults",
  "content_style": "Authentic promotional content",
  "location": "Chennai",
  "platform": "youtube",
  "min_followers": 5000,
  "max_followers": 100000,
  "min_engagement": 1,
  "limit": 10
}
```

The system retrieves candidates and returns ranked AI matches.

------------------------------------------------------------------------

# Environment Variables

Create a `.env` file:

``` env
DATABASE_URL=your_postgresql_connection_string

GROQ_API_KEY=your_groq_api_key
GROQ_LLM_MODEL=your_groq_model

GEMINI_API_KEY=your_gemini_api_key
GEMINI_LLM_MODEL=your_gemini_model

YOUTUBE_API_KEY=your_youtube_api_key
```

Never commit API keys, OAuth tokens, or credentials to GitHub.

------------------------------------------------------------------------

# Local Setup

## Backend

``` powershell
cd BACKEND
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Backend:

``` text
http://127.0.0.1:8000
```

Swagger:

``` text
http://127.0.0.1:8000/docs
```

Health check:

``` text
http://127.0.0.1:8000/health
```

## Frontend

Open another terminal:

``` powershell
cd FRONTEND
npm.cmd install
npm.cmd run dev
```

Frontend:

``` text
http://localhost:5173
```

------------------------------------------------------------------------

# Database

The current architecture uses PostgreSQL with pgvector.

Vector embeddings are stored and searched directly in PostgreSQL.

The current architecture does not use ChromaDB as the vector store.

------------------------------------------------------------------------

# Security

Sensitive configuration is stored outside source code.

Do not commit:

``` text
.env
credentials.json
token.json
```

Gmail outreach uses OAuth authorization.

Email sending requires human approval before the send operation.

------------------------------------------------------------------------

# Error Handling

The backend validates:

-   Campaign input
-   Matching limits
-   Retrieval results
-   LLM JSON responses
-   Returned influencer IDs
-   Match scores
-   Outreach status
-   Duplicate email sends
-   External API failures

LLM-generated influencer IDs are validated against the retrieved
candidate set before the result is returned.

------------------------------------------------------------------------

# Future Improvements

-   Pagination for large creator databases
-   Retrieval diversification
-   Multi-platform influencer support
-   Campaign analytics
-   Email open/reply tracking
-   Automated follow-ups
-   CRM integrations
-   Team workspaces
-   Role-based access control
-   Feedback-driven recommendation improvement
-   Audience demographic analysis

------------------------------------------------------------------------

# Why InfluenceAI?

Influencer marketing research traditionally involves manually searching
creators, checking metrics, evaluating relevance, writing messages, and
sending emails.

InfluenceAI combines these steps into a single AI-assisted workflow:

``` text
Discover
   ↓
Filter
   ↓
Retrieve
   ↓
Match
   ↓
Rank
   ↓
Generate
   ↓
Review
   ↓
Send
```

The goal is to reduce repetitive research and outreach work while
keeping the marketer in control of final communication.

------------------------------------------------------------------------

# Project Highlights

-   Full-stack AI SaaS application
-   FastAPI backend
-   React + Vite frontend
-   PostgreSQL + pgvector
-   768D Gemini embeddings
-   Hybrid RAG retrieval
-   LLM-based influencer ranking
-   Groq primary + Gemini fallback
-   Streaming LLM responses
-   YouTube Data API integration
-   Gmail API integration
-   Human-in-the-loop outreach
-   Duplicate-send protection
-   Production-oriented API architecture
-   Vercel + Render deployment architecture

------------------------------------------------------------------------

# Author

**Harini P**

B.Tech --- Artificial Intelligence & Data Science

AI / ML Engineer \| Generative AI \| RAG \| LLM Applications

------------------------------------------------------------------------

## License

This project is developed as an AI/ML portfolio project.
