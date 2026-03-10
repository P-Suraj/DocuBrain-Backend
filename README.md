# DocuBrain 🧠

A personal project I built to explore how RAG (Retrieval-Augmented Generation) pipelines work under 
the hood. The idea was simple — I wanted to be able to chat with my own PDF documents without sending 
everything to OpenAI and paying per token.

## What it does

Upload any PDF through the UI or API, and DocuBrain will extract the text, chunk it intelligently, 
generate vector embeddings locally, and let you ask natural language questions about the document content.

## Why I built this

I was curious about how tools like ChatPDF actually work internally. Instead of following a tutorial, 
I tried to build it from scratch — figuring out chunking strategies, why overlapping chunks matter, 
and how vector similarity search actually retrieves the right context. The biggest challenge was getting 
the embedding + retrieval pipeline to feel responsive without burning API credits.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** Vanilla JS/CSS (Dark Mode UI served from Express)
- **File Handling:** Multer, pdf-parse
- **Embeddings:** Xenova Transformers (all-MiniLM-L6-v2) — runs locally on CPU, zero API cost
- **Vector Storage:** MongoDB Atlas Vector Search
- **Text Splitting:** LangChain RecursiveCharacterTextSplitter
- **LLM:** Groq API (Llama-3.3-70B)

## How it works

1. Upload a PDF via the UI or the `/upload` endpoint.
2. Text is extracted and split into overlapping chunks (500 chars, 50 char overlap).
3. Each chunk is embedded locally using Xenova — no external API needed.
4. Embeddings are stored in MongoDB Atlas with a Vector Search index enabled.
5. On chat, the top 3 most relevant chunks are retrieved via cosine similarity.
6. Retrieved context is passed to Groq's Llama-3.3-70B model to generate the final answer.

## API & Interface

DocuBrain includes a built-in Dark Mode UI served directly from the Express backend, but can also 
be consumed as a REST API.

### Upload PDF
`POST /upload`
- **Form Data:** `pdfFile` (PDF file)
- **Returns:** Total chunks created and a preview of the extracted text.

### Chat with Document
`POST /chat`
- **Body:** `{ "query": "your question here" }`
- **Returns:** AI-generated answer grounded in the retrieved document context, plus the source chunks.

## What I learned

- Why chunk overlap matters for context preservation across splits
- How cosine similarity search works in practice with MongoDB Atlas
- The tradeoff between local embeddings (slow but free) vs API embeddings (fast but costly)
- How to keep LLM responses grounded using retrieved context instead of model memory

## Setup
```bash
git clone https://github.com/P-Suraj/docubrain.git
cd docubrain
npm install

# Create a .env file in the root directory
# Add: GROQ_API_KEY=your_key and MONGO_URI=your_mongodb_atlas_connection_string

npm run dev  # Starts the server with nodemon
# Open http://localhost:5000 in your browser to view the UI
```

---

Built by Suraj — 2nd year CSE @ Amrita Vishwa Vidyapeetham