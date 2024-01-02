require("dotenv").config();
const express = require("express");
const { OpenAI } = require("openai"); // Adjusted for potential ES6 import
const cors = require("cors");
const axios = require("axios");
const app = express();
const nodemailer = require('nodemailer');

// Initialize the OpenAI API configuration
const openAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

app.post('/api/send-email', async (req, res) => {
  let { name, email, message } = req.body;

  // Set up Nodemailer transport
  const transporter = nodemailer.createTransport({
    service: 'YourEmailService', // e.g., 'gmail', 'outlook'
    auth: {
      user: 'steve.kurowski@fluentenglish.ca',
      pass: 'S1lverch4ir', // It's safer to use environment variables for credentials
    },
  });

  // Email options
  const mailOptions = {
    from: email,
    to: 'info@fluentenglish.ca',
    subject: `New contact from ${name}`,
    text: message,
  };

  // Send the email
  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: error.message });
  }
});


// Endpoint for Google Job Search
app.get("/api/search-jobs", async (req, res) => {
  const { query } = req.query;

  try {
    const response = await axios.get("https://serpapi.com/search", {
      params: {
        engine: "google_jobs",
        q: query,
        api_key: process.env.SERP_API_KEY, // Ensure you have this in your .env file
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error with Google Job Search API:", error);
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/analyze-resume", async (req, res) => {
  const { resumeText, jobDescriptionText } = req.body;

  try {
    const response = await openAI.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content:
            "Conduct a comprehensive analysis of the provided resume and job description. If it appears the resume and job description are reversed, please switch the order of these documents. Start by identifying keywords and key phrases in the resume that align with the job description with at least a 90% fit. Please format your response as follows:\n\nResume Keywords:\n- [List of keywords from the resume]\n\nJob Description Keywords:\n- [List of keywords from the job description]\n\nMissing Keywords:\n- [List of keywords from the job description not present in the resume]\n\nAssessment:\n- [Provide a detailed evaluation of the resume in relation to the job requirements]\n\nEmployability Score:\n- [Assign a score out of 100, considering factors such as relevance of experience, skills match, and overall presentation]\n\nBest Possible Job:\n- [Suggest an alternative role that may suit the candidate's profile, based on the resume and current job market trends].",
        },
        {
          role: "user",
          content: resumeText,
        },
        {
          role: "user",
          content: jobDescriptionText,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    //console.log("Request body:",req.body);
    // Log the message content to ensure correct access
    console.log("OpenAI message content:", response.choices[0].message);

    // Access the message content
    const messageContent = response.choices[0].message.content;
    // Send the message content back to the client
    res.json({ message: messageContent });
  } catch (error) {
    console.error("Error with OpenAI API:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/submit-revision", async (req, res) => {
  const { resume, jobDescription, revisions } = req.body;
  console.log(
    "Resume: ",
    resume,
    "Job Description: ",
    jobDescription,
    "Revisions: ",
    revisions
  );
  try {
    const response = await openAI.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content:
            "Analyze the revised resume text, original resume text, and the job description. Then, create a 'Final Resume:' that blends the highlights from both the revised and original resumes. This final draft should be honest, succinct, and truly reflect the candidate's skills and experiences, while strategically embedding relevant keywords from within the job description. Select from the resume primarily specific, quantifiable achievements, education, and experience to showcase the candidate's impact. For brevity, do not include material which does not strongly align with the job description.  Opt for a layout that's both professional and infused with a human touch, adding variability in its structure. Next, for the 'EScore:', assign a score out of 100. Remember, perfection is rare. If key qualifications for the job are absent in the resume, adjust the score starting from 50 or as appropriate. Present the EScore simply, with the heading and score on the same line, sans extra details. In crafting the 'Cover Letter:', weave an engaging, personal narrative that heavily incorporates keywords from the job description, alongside the best elements of the revised resume. The letter should be clear, convincing, and underscore the candidate's fit for the role. Follow these guidelines for each paragraph: aim for at least 5 sentences, beginning with a key thematic sentence. Include a blend of 2 simple, 2 complex, and 1 compound sentence, varying the lengths for added interest. Use GRE-level vocabulary for college graduates, and simpler language with occasional GRE words for those without a college background. Employ a mix of verb tenses - simple, progressive, perfect, perfect progressive - to depict the full spectrum of an adult’s experiences. Finalize the cover letter in a basic text format, emphasizing authenticity and a personal touch, while ensuring maximum keyword integration for ATS compatibility.",
        },
        {
          role: "user",
          content: resume,
        },
        {
          role: "user",
          content: jobDescription,
        },
        {
          role: "user",
          content: revisions,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    // Access the message content
    console.log("OpenAI message content:", response.choices[0].message);
    const messageContent = response.choices[0].message.content;
    // Send the message content back to the client
    res.json({ message: messageContent });
  } catch (error) {
    console.error("Error with OpenAI API:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/interview-assessment", async (req, res) => {
  try {
    const { qaPairs } = req.body;
    console.log("qaPairs sent to OpenAI: ", qaPairs);
    // Process qaPairs and format them as needed for OpenAI
    const formattedInput = formatInputForOpenAI(qaPairs);
    console.log("Formatted Input: ", formattedInput);
    const response = await openAI.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content:
            "Analyze each of the following interview question responses in the included data from a hiring manager's perspective.  There are several parts to consider: the actual answers, the charRatio, the question, the spokenChars, the submissionCount, the timeTaken, and the typedChars.  Provide an analysis of the response focusing on clarity, relevance to the question, and user response word count aiming for about 120 words.  Confidence is measured by [[[the intersection of the length and clarity of the answer delivered over a reasonable time interval (reasonable = 2 words/ second)]]], and [[[the submissionCount, the timeTaken (in milliseconds), and the charRatio (lower is better on all counts)]]] for each question. For charRatio, less than 1 means mostly spoken.  More than 1 means mostly typed.  Users should aim for mostly spoken (very low charRatio value i.e.: 0.1) for high confidence.  Then, give a score from 1 (low) to 100 (High) on the user's capacity to answer the question based on the analysis of the answers and the confidence. The score should reflect how well the user meets the criteria in their response but should refer only to the answer and not the measures (the submissionCount, the timeTaken, and the charRatio).  If the confidence measures appear low, say something like, `confidence for this question appears low`and something appropriate for other middle and higher values of confidence (high confidence is best). The answer must be returned in the following format: '\nQuestion [Question Number]:\n[Insert Question Here]\nUser Response to question:\n[User's answers to question]\nSubmissions:\n[User's response submissionCount for question]\nResponse Time:\n[User's timeTaken for question]\ncharRatio:\n[User's charRatio for question]\nResponse Analysis:\n[OpenAI Response]\nScore:\n[Assessed Score for the question]'.",
        },
        {
          role: "user",
          content: formattedInput,
        },
      ],
      temperature: 0.4,
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    console.log(
      "OpenAI interview analysis content:",
      response.choices[0].message
    );
    const messageContent = response.choices[0].message.content;
    // Send the message content back to the client
    res.json({ message: messageContent });
  } catch (error) {
    console.error("Error with OpenAI API:", error);
    res.status(500).json({ error: error.message });
  }
});

function formatInputForOpenAI(qaPairs) {
  return qaPairs.map((pair, index) => {
    // Format each question-answer pair with all relevant data
    return `Question ${index + 1}:\n${pair.question}\nUser Response to question:\n${pair.answers.join(" ")}\nSubmissions:\n${pair.submissionCount}\nResponse Time:\n${pair.timeTaken}\ncharRatio:\n${pair.charRatio}`;
  }).join("\n\n");
}


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
