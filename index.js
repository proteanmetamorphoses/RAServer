require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai'); // Adjusted for potential ES6 import
const cors = require('cors');
const app = express();

// Initialize the OpenAI API configuration
const openAI = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());
app.post('/api/analyze-resume', async (req, res) => {
    const { resumeText, jobDescriptionText } = req.body;

    try {
      const response = await openAI.chat.completions.create({
        "model": "gpt-4-1106-preview",
        "messages": [
          {
            "role": "system",
            "content": "Conduct a comprehensive analysis of the provided resume and job description. Start by identifying keywords and key phrases in the resume that align strongly with the job description. Please format your response as follows:\n\nResume Keywords:\n- [List of keywords from the resume]\n\nJob Description Keywords:\n- [List of keywords from the job description]\n\nMissing Keywords:\n- [List of keywords from the job description not present in the resume]\n\nAssessment:\n- [Provide a detailed evaluation of the resume in relation to the job requirements]\n\nEmployability Score:\n- [Assign a score out of 100, considering factors such as relevance of experience, skills match, and overall presentation]\n\nBest Possible Job:\n- [Suggest an alternative role that may suit the candidate's profile, based on the resume and current job market trends].",
          },
          {
            "role": "user",
            "content": resumeText,
          },
          {
            "role": "user",
            "content": jobDescriptionText,
          }
        ],
        "temperature": 0.2,
        "max_tokens": 2000,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0
      }
      );
      //console.log("Request body:",req.body);
      // Log the message content to ensure correct access
      console.log("OpenAI message content:", response.choices[0].message);
     
      
  
      // Access the message content
      const messageContent = response.choices[0].message.content;
      // Send the message content back to the client
      res.json({ message: messageContent });
      
    } catch (error) {
      console.error('Error with OpenAI API:', error);
      res.status(500).json({ error: error.message });
    }
  });

app.post('/api/submit-revision', async (req, res) => {
  const { resume, jobDescription, revisions } = req.body;
    console.log("Resume: ", resume, "Job Description: ", jobDescription, "Revisions: ", revisions);
    try {
      const response = await openAI.chat.completions.create({
        "model": "gpt-4-1106-preview",
        "messages": [
          {
            "role": "system",
            "content": "Analyze the revised resume text, original resume text, and job description. Integrate the revised resume text and the original resume under the heading 'Final Resume:' Ensure that the final document is truthful, accurately reflects the candidate's skills and experiences, is free of irrelevant content for brevity, and utilizes as many of the job description's keywords as possible. Add specific numbers achieved by actions taken where applicable and relevant. Arrange the content with appropriate sections and spacing for a professional appearance.\n\nUnder the heading 'EScore:', provide a precise score out of 100, acknowledging that a perfect score is unlikely. If specific credentials are required for the job and not present in the resume, the score must reflect this with a value of 50 or appropriate.\n\nUnder the heading 'Cover Letter:', craft a clear, concise, and compelling cover letter that utilizes keywords from the job description and draws on relevant examples from the revised resume. Focus on creating a narrative that showcases the candidate’s suitability for the position without exaggeration. Include the user's letter heading for a personalized touch. Return the cover letter in basic text format, focusing on content rather than design.",
          },
          {
            "role": "user",
            "content": resume,
          },
          {
            "role": "user",
            "content": jobDescription,
          },
          {
            "role": "user",
            "content": revisions,
          }
        ],
        "temperature": 0.4,
        "max_tokens": 2000,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0
      }
      );

          
      // Access the message content
      console.log("OpenAI message content:", response.choices[0].message);
      const messageContent = response.choices[0].message.content;
      // Send the message content back to the client
      res.json({ message: messageContent });
      
    } catch (error) {
      console.error('Error with OpenAI API:', error);
      res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
