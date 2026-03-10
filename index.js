const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // frontend backend
const multer = require('multer'); // pdf input
const path = require('path'); // 
const fs = require('fs'); 
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters'); // text split in chunks??
const connectDB=require('./config/db'); // database connection
const Document=require('./models/Document'); // document model
const pdfParse = require('pdf-parse/lib/pdf-parse.js'); // text parse from pdf


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; 

app.use(cors());
// Serve static files from the 'public' folder
app.use(express.static('public')); 
app.use(express.json()); // converst info to json?

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }    
}); // file storage
const upload = multer({storage});

app.get('/', (req, res) => { res.send('DocuBrain API is running...🚀'); });


let pipeline; 
let extractor;
// We will load this lazily inside the route or on server start
connectDB();
app.post('/upload', upload.single('pdfFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        console.log("File received:", req.file.path);

        // 1. Parse PDF
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(dataBuffer);  // all pdf data here
        const rawText = data.text || "";

        // 2. Split Text
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500, // Smaller chunks are better for local models
            chunkOverlap: 50,
        }); // slipt data into chuncks
        const chunks = await splitter.createDocuments([rawText]);
        
        if (chunks.length === 0) return res.status(400).json({ message: "No text found" });
        console.log(`Processing ${chunks.length} chunks...`);

        
        // Dynamically import the library since it is ESM
        if (!pipeline) {
  const transformer = await import('@xenova/transformers');
  pipeline = transformer.pipeline;
  extractor = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2'
  );
}

        console.log("Generating embeddings and saving to DB...");

        for (const chunk of chunks) {
  const output = await extractor(chunk.pageContent, {
    pooling: 'mean',
    normalize: true
  });

  const vector = Array.from(output.data);

  await Document.create({
    fileName: req.file.originalname,
    text: chunk.pageContent,
    vector: vector
  });
}


        console.log('--- STORAGE SUCCESS ---');
        console.log(`Saved ${chunks.length} chunks to MongoDB.`);

        // Cleanup file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            message: "PDF Processed, Embedded and Stored in MongoDB!",
            chunkSaved: chunks.length
        });
        
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: 'Processing failed', error: error.message });
    }


    

});
app.post('/search', async (req,res) => {
        try {
            const { query } = req.body;
            if (!query) return res.status(400).json({ message: "Query is required" });

            console.log(`Searching for: "${query}"`);

            if(!pipeline){
              const transformer = await import ('@xenova/transformers');
              pipeline = transformer.pipeline;
            }
            extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

            const output = await extractor(query,{pooling: 'mean', normalize:true});
            const queryVector = Array.from(output.data);

            const results = await Document.aggregate([
              {
                "$vectorSearch": {
                  "index": "vector_index",
                  "path": "vector",
                  "queryVector": queryVector,
                  "numCandidates": 50,
                  "limit": 3
                }
              },
              {
                "$project": {
                  "_id": 0,
                  "text": 1,
                  "fileName": 1,
                  "score": { "$meta": "vectorSearchScore" }
                }
              }
            ]);
            console.log(`Found ${results.length} results.`);

            res.status(200).json({ results });
        } catch (error) {
            console.error("Search Error:", error);
            res.status(500).json({ message: "Search failed", error: error.message });
        }
    });

    const OpenAI = require ('openai');
    const openai= new OpenAI({
baseURL: 'https://api.groq.com/openai/v1',    
   apiKey: process.env.GROQ_API_KEY          
    });
    app.post('/chat',async (req,res) => {
      try{
        const {query}= req.body;
        if(!query) return res.status(400).json({message:"Query is required"});

        console.log(`\n--- NEW CHAT: "${query}" ---`);

        if(!pipeline){
          const transformer = await import ('@xenova/transformers');
          pipeline = transformer.pipeline;
        }

        extractor = await pipeline('feature-extraction','Xenova/all-MiniLM-L6-v2');

        const output = await extractor (query,{pooling:'mean', normalize:true});
        const queryVector = Array.from (output.data);

        const searchResults = await Document.aggregate ([
          {
            "$vectorSearch": {
              "index":"vector_index",
              "path":"vector",
              "queryVector": queryVector,
              "numCandidates":50,
              "limit":3
            }
          },  
          {
            "$project": {
              "text":1,
              "score": {"$meta":"vectorSearchScore"}
            }
          }
        ]);

        if(searchResults.length ===0){
          return res.json ({ answer: "I couldn't find anything in the document about that."});
        }

        const contextTexts = searchResults.map((doc) => doc.text).join('\n---\n');
        console.log("Context Found:", searchResults.length, "chunks");

        const systemPrompt=`
        You are a helpful AI assistant named DocuBrain.
        You are given a User Question and some context from a document.
        
        Strict Rules:
        1.Answer the question using ONLY the provided context.
        2.If the answer is not in the context, say "I don't know based on this document."
        3.Keep the answer concise and professional.
        `;

        const completion = await openai.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Context:\n${contextTexts}\n\nQuestion: ${query}` }
          ],
        
          temperature: 0.7,
        });

        const answer = completion.choices[0].message.content;

        console.log("AI Answer:",answer);
        res.status(200).json({
          answer: answer,
          sources: searchResults
        });
      }
        catch (error){
          console.error("Chat Error:", error);
          res.status(500).json({ message: "Chat failed", error: error.message });
        }
      });
      
      


     

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});