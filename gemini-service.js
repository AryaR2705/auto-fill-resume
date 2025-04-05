// Gemini API integration

// API Key for Gemini API
const API_KEY = "AIzaSyA2uIZEvqm3r4Vipso_2EwwOa6Wxp_YZz4"; // Replace with your actual API key

// Simplified custom prompt
const CUSTOM_PROMPT = `
Name: Arya Anil Ramteke
DOB: 27 may 2003 in nagpur
Gender: Male
Age: 21
Password: Jinkazama@#1234
Nationality: Indian
Current Location: Pune, India (Working at CDK Global, Yerwada)
Hometown: Nagpur, India
Relocation Flexibility: Open to relocating anywhere
Contact Information: Phone: +91 8329843704 
Email: aryarramteke@gmail.com
Education: Graduation (Expected May 2025): 
Degree: B.Tech/B.E Institute: VIIT Pune (Vishwakarma Institute of Information Technology)
12th (Govt College of Engineering, Buldi, Nagpur)
10th (SOS Nagpur, 2019)
Work Experience:
Current Role: Working at CDK Global, Pune (Yerwada)
Prior Experience: None (First job/internship)
Military/Government Relations: None (No family history in military/government jobs)
Skillset:
Artificial Intelligence & Machine Learning: Fine-Tuning, Generative AI Tools, Large Language Models (LLM), Stable Diffusion
Programming & Development: Python, C, C++, C#, JavaScript, Node.js, React.js, ASP.NET, Full-Stack Development
Cybersecurity & Networking: Network Security, Burp Suite, Ghidra
Database & Data Management: SQL, SQLite, MongoDB, DBMS, Microsoft SQL Server
Data Science & Analytics: Data Structures, Algorithms, Data Analytics, Machine Learning
Tools & Platforms: Git, Jira, Selenium
Soft Skills & Miscellaneous: Communication, Human Resources (HR), Design, Video Editing
Additional Notes:
No disabilities.
Currently in the 4th year of college, graduating in May 2025.
Open to relocation and new opportunities.

Based on the above profile information, determine what information should be provided for this form field. Give only the value to fill, no explanations.
`;

// Get value from Gemini API
async function getValueFromGemini(elementContext) {
  try {
    const promptText = generatePrompt(elementContext);
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: promptText
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 100
        }
      })
    });
    
    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text;
      return text.trim();
    }
    
    return null;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return null;
  }
}

// Generate a prompt for the API based on the element context
function generatePrompt(context) {
  let prompt = CUSTOM_PROMPT + '\n\n';
  
  prompt += `Form Element Details:
Type: ${context.type}${context.inputType ? ' (' + context.inputType + ')' : ''}
ID: ${context.id}
Name: ${context.name}
Placeholder: ${context.placeholder}
Label: ${context.label}
Required: ${context.required}
`;

  if (context.surroundingText) {
    prompt += `Surrounding text: ${context.surroundingText}\n`;
  }
  
  // Include standard dropdown options if available
  if (context.options && context.options.length > 0) {
    prompt += 'Available dropdown options (respond with exact text as shown):\n';
    context.options.forEach((option, index) => {
      prompt += `  ${index + 1}. ${option.text || option.value}\n`;
    });
  }
  
  // Include scraped dropdown or date picker options if available
  if (context.scrapedOptions) {
    prompt += 'Detected form options:\n';
    
    if (Array.isArray(context.scrapedOptions)) {
      // Regular dropdown options
      context.scrapedOptions.forEach((option, index) => {
        prompt += `  ${index + 1}. ${option}\n`;
      });
    } else if (typeof context.scrapedOptions === 'object') {
      // Date of birth components
      if (context.scrapedOptions.day) {
        prompt += `  Days: ${context.scrapedOptions.day.join(', ')}\n`;
      }
      if (context.scrapedOptions.month) {
        prompt += `  Months: ${context.scrapedOptions.month.join(', ')}\n`;
      }
      if (context.scrapedOptions.year) {
        prompt += `  Years: ${context.scrapedOptions.year.join(', ')}\n`;
      }
    }
    
    prompt += 'For dropdown, date picker, or select options, respond with the exact text of the option to select.\n';
  }
  
  prompt += '\nValue to fill (respond with ONLY the value, no explanations):';
  
  return prompt;
}