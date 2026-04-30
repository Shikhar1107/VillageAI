# VillageAI – Multilingual Voice AI Assistant for Farmers

## Overview
An end-to-end voice-based AI assistant enabling Indian farmers 
to query crop-related information in regional dialects. Built 
with a dual-translation RAG architecture — dialect to English 
for retrieval, English back to dialect for response delivery.

## Architecture
Farmer Voice (Dialect)
→ AWS Transcribe (Speech to Text)
→ AWS Translate (Dialect → English)
→ RAG Pipeline (BAAI/bge + Cross-Encoder Reranking)
→ LLM Response Generation
→ AWS Translate (English → Dialect)
→ AWS Polly (Text to Speech)
→ Farmer hears response in native dialect

## Technical Highlights
- **Embedding Model**: BAAI/bge-base-en-v1.5 — chosen for 
  dense semantic retrieval and intent matching over keywords
- **Chunking Strategy**: LLM-based structured chunking to 
  preserve semantic boundaries across crop documents
- **Reranker**: cross-encoder/ms-marco-MiniLM-L-6-v2 — 
  resolves failure mode where vector search returned 
  semantically similar but agronomically incorrect results
- **Dual Translation**: Dialect → English for RAG retrieval, 
  English → Dialect for response delivery

## Tech Stack
- **Backend**: FastAPI, Python
- **Frontend**: React
- **AI/ML**: BAAI/bge-base-en-v1.5, Cross-Encoder reranker,
  HuggingFace Transformers
- **AWS**: Transcribe, Translate, Polly, EC2, S3
- **RAG**: Custom pipeline with chunking and reranking

## Problem Solved
Vector search alone retrieved semantically similar but 
agronomically incorrect crop conditions. Cross-encoder 
reranking resolved this critical failure mode, significantly 
improving retrieval accuracy for agricultural queries.

## Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

```bash
cd frontend
npm install
npm start
```