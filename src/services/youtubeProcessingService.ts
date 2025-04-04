
import { generateFlowchart, FlowchartData } from "./flowchartService";
import { generateFlashcards, generateNotes, generateKeyPoints } from "./api";
import { generateVideoSummary, VideoSummary } from "./summaryService";

// Processing multiple items in parallel for speed
export const processYoutubeContent = async (
  transcriptText: string
): Promise<{
  summary: VideoSummary;
  keyPoints: string[];
  isComplete: boolean;
}> => {
  try {
    // Process summary and key points in parallel for faster results
    const [summary, keyPoints] = await Promise.all([
      generateVideoSummary(transcriptText),
      generateKeyPoints(transcriptText)
    ]);
    
    return {
      summary,
      keyPoints,
      isComplete: true
    };
  } catch (error) {
    console.error("Error processing YouTube content:", error);
    throw error;
  }
};

// Generate flowchart from key points quickly
export const generateFlowchartFromKeyPoints = async (
  keyPoints: string[]
): Promise<FlowchartData> => {
  // Join key points into a single text for faster processing
  const keyPointsText = keyPoints.join("\n\n");
  
  try {
    const flowchart = await generateFlowchart(keyPointsText);
    return flowchart;
  } catch (error) {
    console.error("Error generating flowchart from key points:", error);
    throw error;
  }
};

// Generate study materials more efficiently
export const generateStudyMaterials = async (
  transcriptText: string
): Promise<{
  flashcards: any[];
  notes: any[];
}> => {
  try {
    // Process flashcards and notes in parallel for faster results
    const [flashcards, notes] = await Promise.all([
      generateFlashcards(transcriptText),
      generateNotes(transcriptText)
    ]);
    
    return { flashcards, notes };
  } catch (error) {
    console.error("Error generating study materials:", error);
    throw error;
  }
};
