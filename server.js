require('dotenv').config();
const dns = require('dns');

// Prioritize IPv4 for DNS resolution
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- MongoDB Connection ---
const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('❌ CRITICAL ERROR: MONGO_URI is missing in your .env file!');
  process.exit(1);
}

mongoose.connect(uri)
  .then((conn) => {
    console.log(`✅ Successfully connected to MongoDB Atlas!`);
    console.log(`📂 Active Database: "${conn.connection.name}"`);
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
  });

// --- Schemas & Models ---
const inquirySchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'] },
  email: { type: String, required: [true, 'Email is required'] },
  phone: { type: String, default: '' },
  preferredCountry: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Inquiry = mongoose.models.Inquiry || mongoose.model('Inquiry', inquirySchema, 'inquiries');

// --- Routes ---

// Health Check
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is operational and server is active!' });
});

// GET Destinations Route (Fixes missing destinations text)
app.get('/api/destinations', (req, res) => {
  res.json([
    { id: 4, country: 'Australia', description: 'Build your future in Australia with internationally recognized universities, industry-focused education, excellent quality of life, post-study work opportunities, and career-oriented degree programs across multiple disciplines.' },
    { id: 3, country: 'Canada', description: 'Study in Canada through leading colleges and universities offering affordable tuition fees, post-graduation work permits (PGWP), multicultural communities, and pathways toward permanent residency for eligible students.' },
    
    { id: 1, country: 'USA', description: 'Study in the USA with guidance from Planet Education Surat. Explore top-ranked universities, STEM programs, scholarships, OPT opportunities, and world-class education that prepares students for successful international careers.' },
    { id: 2, country: 'UK', description: 'Pursue higher education in the United Kingdom with access to globally recognized universities, one-year masters programs, excellent research opportunities, graduate route work visas, and internationally respected qualifications.' }
    
  ]);
});

// GET Services Route (Fixes missing core services text)
app.get('/api/services', (req, res) => {
  res.json([
    { id: 1, title: 'University Admissions', description: 'Receive complete assistance with university selection, application submission, admission documentation, statement of purpose (SOP), letters of recommendation, scholarship applications, and offer letter processing for leading international universities.' },
    { id: 2, title: 'Visa Assistance', description: 'Our experienced visa consultants guide students through every stage of the student visa process, including document verification, financial preparation, visa filing, interview preparation, and compliance with country-specific immigration requirements.' },
    { id: 3, title: 'Career Counseling', description: 'Get personalized career guidance based on your academic background, career aspirations, preferred destination, budget, and future employment opportunities. Our counselors help students choose the right course and university.' }
  ]);
});

// Counseling Form Submission Handler
app.post('/api/counseling', async (req, res) => {
  console.log('\n========================================');
  console.log('📩 [POST /api/counseling] Submission Triggered');
  console.log('Payload Received:', req.body);
  console.log('========================================\n');

  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is empty.'
      });
    }

    const { name, email, phone, preferredCountry } = req.body;

    const newInquiry = new Inquiry({
      name,
      email,
      phone,
      preferredCountry
    });

    const savedInquiry = await newInquiry.save();

    console.log('✅ Document saved to MongoDB Atlas:', savedInquiry);

    return res.status(201).json({
      success: true,
      message: 'Free counseling request submitted successfully!',
      data: savedInquiry
    });

  } catch (error) {
    console.error('❌ MongoDB Save Failure:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to save inquiry to database',
      error: error.message
    });
  }
});

// Catch-All
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server actively listening on http://localhost:${PORT}`);
});
