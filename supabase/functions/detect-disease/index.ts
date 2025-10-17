import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { image } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Detecting disease in image...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert plant pathologist specializing in agricultural disease diagnosis. Analyze plant leaf images and provide:
1. Disease identification (be specific - name the exact disease)
2. Confidence level (high/medium/low)
3. Severity assessment (mild/moderate/severe)
4. Symptoms observed
5. Treatment recommendations (organic and chemical options)
6. Prevention tips

Format your response as JSON with these exact fields:
{
  "disease": "Disease name or 'Healthy'",
  "confidence": "high/medium/low",
  "severity": "mild/moderate/severe/none",
  "symptoms": ["symptom1", "symptom2"],
  "treatment": {
    "organic": ["treatment1", "treatment2"],
    "chemical": ["treatment1", "treatment2"]
  },
  "prevention": ["tip1", "tip2"]
}

If the plant appears healthy, set disease to "Healthy" and severity to "none".`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this plant leaf image for any diseases or health issues.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service quota exceeded. Please contact support.' }),
          { 
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI Response:', content);

    // Parse the JSON response from the AI
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if AI didn't return proper JSON
        result = {
          disease: 'Analysis completed',
          confidence: 'medium',
          severity: 'moderate',
          symptoms: [content.substring(0, 100)],
          treatment: {
            organic: ['Consult local agricultural expert'],
            chemical: ['Consult local agricultural expert']
          },
          prevention: ['Regular monitoring', 'Proper plant care']
        };
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      result = {
        disease: 'Unable to parse results',
        confidence: 'low',
        severity: 'unknown',
        symptoms: [content.substring(0, 200)],
        treatment: {
          organic: ['Consult agricultural expert'],
          chemical: ['Consult agricultural expert']
        },
        prevention: ['Regular plant inspection']
      };
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in detect-disease function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
