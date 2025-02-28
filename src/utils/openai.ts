import OpenAI from 'openai';
import toast from 'react-hot-toast';

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

// Function to enhance mockup design
export async function enhanceMockupDesign(
  designImage: string | File,
  mockupImage: string,
  designArea: { points: { x: number; y: number }[] }
): Promise<string> {
  try {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API key is missing');
    }

    // Convert files to base64 if needed
    const designBase64 = designImage instanceof File ? 
      await fileToBase64(designImage) : designImage;

    // Create mask image from design area
    const maskBase64 = createDesignAreaMask(designArea);

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Enhance this design by matching the lighting and fabric texture of the mockup template. Apply realistic fabric texture, shadows, and highlights while maintaining the design's integrity. The mask shows the target area."
            },
            {
              type: "image_url",
              image_url: { url: designBase64 }
            },
            {
              type: "image_url",
              image_url: { url: mockupImage }
            },
            {
              type: "image_url",
              image_url: { url: maskBase64 }
            }
          ]
        }
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const result = response.choices[0].message.content;
    if (!result) throw new Error('No response from AI service');

    const parsed = JSON.parse(result);
    if (!parsed.image_url) throw new Error('No image URL in response');

    return parsed.image_url;
  } catch (error) {
    console.error('Error enhancing mockup:', error);
    throw error;
  }
}

// Helper function to convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper function to create mask image
function createDesignAreaMask(designArea: { points: { x: number; y: number }[] }): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; // Standard size for API
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Draw white polygon for design area
  ctx.fillStyle = 'white';
  ctx.beginPath();
  designArea.points.forEach((point, i) => {
    if (i === 0) ctx.moveTo(point.x * canvas.width, point.y * canvas.height);
    else ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
  });
  ctx.closePath();
  ctx.fill();

  return canvas.toDataURL();
}

// Function to generate keywords for a category
export async function generateCategoryKeywords(categoryName: string): Promise<string[] | null> {
  try {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API key is missing');
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Generate 25 specific single-word keywords for the category "${categoryName}".
                   Guidelines:
                   - Only single words, no phrases
                   - Highly specific to the category
                   - Include synonyms and variations
                   - Include related subcategories
                   - Include common misspellings
                   - Focus on search-optimized terms
                   
                   Format the response as a JSON array of strings.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response received from AI service');
    }

    const result = JSON.parse(content);
    if (!Array.isArray(result.keywords)) {
      throw new Error('Invalid AI response format - expected keywords array');
    }

    // Clean and filter keywords
    const cleanedKeywords = result.keywords
      .map(k => k.trim().toLowerCase())
      .filter(k => !k.includes(' ')) // Remove any multi-word responses
      .filter(Boolean)
      .filter((k, i, arr) => arr.indexOf(k) === i); // Remove duplicates

    return cleanedKeywords;

  } catch (error) {
    console.error('Error generating keywords:', error);
    if (error.status === 404) {
      toast.error('The AI model is temporarily unavailable. Please try again later.');
    } else {
      toast.error(error instanceof Error ? error.message : 'Failed to generate keywords');
    }
    return null;
  }
}

// Function for generating keywords only
export async function generateKeywordSuggestions(file: File): Promise<string[] | null> {
  try {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API key is missing');
    }

    // Convert file to base64 data URL
    const base64Image = await fileToBase64(file);

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this design image and generate 20-25 relevant search keywords that would help customers find this design. Consider the style, theme, colors, mood, and any text or elements in the image. Format the response as JSON with a 'keywords' array."
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image
              }
            }
          ],
        },
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response received from AI service');
    }

    const result = JSON.parse(content);
    if (!Array.isArray(result.keywords)) {
      throw new Error('Invalid AI response format - expected keywords array');
    }

    // Clean and filter keywords
    const cleanedKeywords = result.keywords
      .map(k => k.trim().toLowerCase())
      .filter(Boolean)
      .filter((k, i, arr) => arr.indexOf(k) === i); // Remove duplicates

    return cleanedKeywords;

  } catch (error) {
    console.error('Error generating keywords:', error);
    if (error.status === 404) {
      toast.error('The AI model is temporarily unavailable. Please try again later.');
    } else {
      toast.error('Failed to generate keywords');
    }
    return null;
  }
}

// Function for analyzing titles only (used by Edit Titles tool)
export async function analyzeTitleOnly(file: File): Promise<{
  title: string;
  description: string;
} | null> {
  try {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('AI service not available');
    }

    // Convert file to base64 data URL
    const base64Image = await fileToBase64(file);

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this design image and provide:\n1. A catchy, marketable title that captures the essence of the design\n2. A compelling product description (2-3 sentences)\n\nIf there is text in the image, incorporate it naturally. Format the response as JSON with fields: 'title' and 'description'."
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image
              }
            }
          ],
        },
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Failed to generate title from image');
    }

    const result = JSON.parse(content);
    if (!result.title || !result.description) {
      throw new Error('Invalid response format from AI');
    }

    return { 
      title: result.title,
      description: result.description
    };

  } catch (error) {
    console.error('Error analyzing title:', error);
    if (error.status === 404) {
      toast.error('The AI model is temporarily unavailable. Please try again later.');
    } else {
      toast.error('Failed to generate title suggestion');
    }
    return null;
  }
}

// Function for full design analysis (used by Edit Design tool)
export async function analyzeImage(file: File): Promise<{
  title: string;
  keywords: string[];
  description: string;
} | null> {
  try {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('AI service not available');
    }

    // Convert file to base64 data URL
    const base64Image = await fileToBase64(file);

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this design image and provide:\n1. First extract any visible text from the image\n2. Create a catchy, marketable title that combines creativity with any extracted text\n3. Write a compelling product description that incorporates both the creative concept and any text from the design (2-3 sentences)\n4. Generate relevant search keywords (20-25 words)\n\nFormat the response as JSON with fields: 'title', 'description', and 'keywords' (as array)."
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image
              }
            }
          ],
        },
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Failed to generate content from image');
    }

    const result = JSON.parse(content);
    if (!result.title || !result.description || !Array.isArray(result.keywords)) {
      throw new Error('Invalid response format from AI');
    }

    return {
      title: result.title,
      description: result.description,
      keywords: result.keywords
    };

  } catch (error) {
    console.error('Error analyzing image:', error);
    if (error.status === 404) {
      toast.error('The AI model is temporarily unavailable. Please try again later.');
    } else {
      toast.error('Failed to analyze image');
    }
    return null;
  }
}