# DocuBrain 🧠

A personal project I built to explore how RAG (Retrieval-Augmented Generation) pipelines work under the hood. 
The idea was simple — I wanted to be able to chat with my own PDF documents without sending everything to OpenAI and paying per token.

## What it does

Upload any PDF, and DocuBrain will extract the text, chunk it intelligently, generate vector embeddings locally, 
and let you ask natural language questions about the document content.

## Why I built this

I was curious about how tools like ChatPDF actually work internally. 
Instead of using a tutorial, I tried to build it from scratch — figuring out chunking strategies, 
why overlapping chunks matter, and how vector similarity search actually retrieves the right context.
The biggest challenge was getting the embedding + retrieval pipeline to feel responsive without burning API credits.

## Tech Stack

- **Backend:** Node.js, Express.js
- **File Handling:** Multer, pdf-parse
- **Embeddings:** Xenova Transformers (all-MiniLM-L6-v2) — runs locally on CPU, zero API cost
- **Vector Storage:** MongoDB Atlas Vector Search
- **Text Splitting:** LangChain RecursiveCharacterTextSplitter
- **LLM:** Groq API (Llama-3.3-70B)

## How it works

1. Upload a PDF via the `/upload` endpoint
2. Text is extracted and split into overlapping chunks (500 chars, 50 char overlap)
3. Each chunk is embedded locally using Xenova — no OpenAI needed
4. Embeddings are stored in MongoDB Atlas with vector search enabled
5. On query, top-3 most relevant chunks are retrieved via cosine similarity
6. Retrieved context is passed to Llama-3.3-70B via Groq to generate the final answer

## API

### Upload PDF
`POST /upload`
- Form Data: `pdfFile` (PDF file)
- Returns: chunks created, preview of first chunk

### Ask a Question
`POST /query`
- Body: `{ "question": "your question here" }`
- Returns: AI-generated answer grounded in the document

## What I learned

- Why chunk overlap matters for context preservation across splits
- How cosine similarity search works in practice with MongoDB Atlas
- The tradeoff between local embeddings (slow but free) vs API embeddings (fast but costly)
- How to keep LLM responses grounded using retrieved context instead of model memory

## Setup
```bash
git clone https://github.com/P-Suraj/docubrain
cd docubrain
npm install
# add your .env with GROQ_API_KEY and MONGODB_URI
node index.js
```

---

Built by Suraj — 2nd year CSE @ Amrita Vishwa Vidyapeetham