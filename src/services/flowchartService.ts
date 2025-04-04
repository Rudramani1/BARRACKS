
import { GEMINI_API_KEY, GEMINI_API_URL } from "./api";

export interface FlowchartData {
  id: string;
  title: string;
  mermaidCode: string;
  content: string;
  createdAt: Date;
}

export const generateFlowchart = async (text: string): Promise<FlowchartData> => {
  try {
    console.log("Generating flowchart with text:", text.substring(0, 50) + "...");
    console.log("Using API URL:", GEMINI_API_URL);
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Generate a Mermaid.js flowchart diagram based on the following content. Focus on creating a hierarchical structure with main topics and subtopics. Format your response with a JSON object containing two fields: "title" - a short descriptive title for the flowchart (max 5 words), and "mermaidCode" - the complete Mermaid.js code for the flowchart.

Important: For the mermaidCode, use simple "graph TD" syntax without any line breaks within node labels. Ensure each node is on its own line. Use simple syntax like:
graph TD
    A[Main Topic] --> B[Subtopic 1]
    A --> C[Subtopic 2]
    B --> D[Detail 1]
    B --> E[Detail 2]

Ensure each relationship is defined on a separate line. Do not use line breaks within node labels or descriptions.

Content: ${text}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate flowchart: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Received response from Gemini API:", data);
    
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON from the response text
    const jsonStart = generatedText.indexOf('{');
    const jsonEnd = generatedText.lastIndexOf('}') + 1;
    const jsonStr = generatedText.substring(jsonStart, jsonEnd);
    
    const flowchartData = JSON.parse(jsonStr);
    console.log("Parsed flowchart data:", flowchartData);
    
    // Clean up the Mermaid code to ensure it's valid
    flowchartData.mermaidCode = flowchartData.mermaidCode
      .replace(/\n\s+\(/g, '[') // Replace node labels with linebreaks and parentheses
      .replace(/\)\n/g, ']\n')  // Close those brackets properly
      .replace(/\n\s+/g, '\n')  // Remove extra whitespace at line beginnings
      .trim();
    
    return {
      id: `flowchart-${Date.now()}`,
      title: flowchartData.title,
      mermaidCode: flowchartData.mermaidCode,
      content: text,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error generating flowchart:", error);
    throw error;
  }
};

// Mock database of flowcharts
let flowcharts: FlowchartData[] = [];

// Save a flowchart
export const saveFlowchart = (flowchart: FlowchartData): FlowchartData => {
  flowcharts.push(flowchart);
  return flowchart;
};

// Get all flowcharts
export const getAllFlowcharts = (): FlowchartData[] => {
  return [...flowcharts];
};

// Get a flowchart by ID
export const getFlowchartById = (id: string): FlowchartData | undefined => {
  return flowcharts.find(flowchart => flowchart.id === id);
};
