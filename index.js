const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {RecursiveCharacterTextSplitter} = require('@langchain/textsplitters');

// 🛠️ FIX: Point directly to the internal file to avoid loading the wrong object
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }    
});

const upload = multer({storage});

app.get('/', (req, res) => {
  res.send('DocuBrain API is running...🚀');
});

app.post('/upload', upload.single('pdfFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        console.log("File received:", req.file.path);

        const dataBuffer = fs.readFileSync(req.file.path);

        // Now we can call it simply again!
        const data = await pdfParse(dataBuffer);
        const rawText=data.text;
        

        console.log("--- PDF Extracted Text (Preview) ---");
        const previewText = data.text ? data.text.substring(0, 500) : "No text found";
        console.log(previewText + "..."); 
        console.log("--- End preview ---");

        res.status(200).json({
            message: 'File uploaded and parsed successfully',
            textPreview: previewText
        });
        
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: 'File processing failed', error: error.message });
    }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});