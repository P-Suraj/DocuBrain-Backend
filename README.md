# DocuBrain Backend 🚀

DocuBrain is an AI-ready backend system that allows users to upload PDF documents, extract text, chunk the content, and prepare it for intelligent search and AI-based question answering.

## Features

- Express.js backend
- PDF file upload using Multer
- PDF text extraction using pdf-parse
- Text chunking using LangChain RecursiveCharacterTextSplitter
- Clean API architecture
- Environment variable support with dotenv

## Tech Stack

- Node.js
- Express.js
- Multer
- pdf-parse
- LangChain
- JavaScript

## API Endpoint

### Upload PDF

`POST /upload`

Form Data:
- pdfFile: PDF file

Response:
- Total chunks created
- Preview of first chunk

## Why this project?

This project demonstrates how modern AI document systems ingest and prepare knowledge for Retrieval-Augmented Generation (RAG) pipelines.

## Future Plans

- Vector embeddings
- Similarity search
- AI Q&A over documents
- Frontend UI
- Authentication

---

Built with ❤️ by Suraj
