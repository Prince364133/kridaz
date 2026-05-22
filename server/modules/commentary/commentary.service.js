import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import OpenAI from 'openai';
import { getIO } from '../../config/socket.js';
import logger from '../../utils/logger.js';
import { prisma } from '../../config/prisma.js';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Connection for BullMQ
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const commentaryQueue = new Queue('commentary-generation', { connection });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate commentary text using OpenAI or templates
 */
const generateCommentaryText = async (liveData, ballEvent, language = 'en', style = 'professional') => {
  const isBoundary = ballEvent.runs >= 4;
  const isWicket = ballEvent.isWicket;
  
  // LEVEL 1: Template Engine for standard deliveries (Fast & Free, English Only)
  if (!isBoundary && !isWicket && language === 'en') {
    const templates = [
      `A solid delivery from the bowler, just ${ballEvent.runs} runs off it.`,
      `Pushed away for ${ballEvent.runs}. Good running between the wickets.`,
      `They take ${ballEvent.runs} runs comfortably.`,
      `That's ${ballEvent.runs} runs added to the total.`
    ];
    if (ballEvent.runs === 0 && !ballEvent.isExtra) {
      return "Solid defense. No run taken.";
    }
    if (ballEvent.isExtra) {
      return `That's an extra, given as ${ballEvent.extraType}.`;
    }
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // LEVEL 2: AI Generation for Boundaries, Wickets, and Non-English Languages
  try {
    const languageMap = {
      'en': 'English',
      'hi': 'Hindi (in Devanagari script)',
      'pa': 'Punjabi (in Gurmukhi script)',
      'bn': 'Bengali (in Bengali script)',
      'mr': 'Marathi (in Devanagari script)',
      'ta': 'Tamil (in Tamil script)',
      'te': 'Telugu (in Telugu script)',
      'gu': 'Gujarati (in Gujarati script)'
    };
    const targetLanguage = languageMap[language] || 'English';

    let styleInstruction = "Professional, Energetic TV Broadcast Style.";
    if (style === 'natural') styleInstruction = "Natural, conversational, like a fan watching the game with friends.";
    if (style === 'funny') styleInstruction = "Humorous, witty, using funny analogies and slightly exaggerated reactions.";
    if (style === 'dramatic') styleInstruction = "Extremely dramatic, screaming at the top of your lungs, treating every moment as a life-or-death situation.";

    const prompt = `
You are a highly emotional, reactive human cricket commentator sitting right in the stadium.
You have a distinct personality and style: ${styleInstruction}

Generate ONE short, completely natural, human-like live commentary line for this exact event. 
React authentically! If it's a wicket, act shocked or excited. If it's a boundary, act thrilled. Do not be robotic. Do not mention names if you don't know them.

Match Situation: 
- Total Score: ${liveData.runs}/${liveData.wickets} in ${liveData.overs} overs.
- Match format: T20.
- Current Event: A batsman just hit ${ballEvent.runs} runs! Is it a wicket? ${isWicket ? "YES!" : "No"}.

CRITICAL INSTRUCTION: You MUST generate the commentary text EXCLUSIVELY in the following language/script: ${targetLanguage}. Do not use English words if you are asked to speak in a regional language.
Return ONLY the commentary text. Nothing else. No quotes, no intro.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 60,
      temperature: 0.8,
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    logger.error("[Commentary] OpenAI Error:", error);
    if (isWicket) return "And that's a brilliant wicket! Huge moment in the match!";
    return "What a fantastic shot that is!";
  }
};

/**
 * TTS generation using OpenAI TTS API
 */
const generateOpenAIAudio = async (text, voiceModel = "alloy") => {
  try {
    const outputFileName = `commentary-${Date.now()}.mp3`;
    const outputPath = path.join(process.cwd(), 'public', 'audio', outputFileName);
    
    // Ensure public/audio directory exists
    const audioDir = path.dirname(outputPath);
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voiceModel,
      input: text,
    });
    
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.promises.writeFile(outputPath, buffer);
    
    // Return the URL path
    return `/audio/${outputFileName}`;
  } catch (error) {
    logger.error("[Commentary] OpenAI TTS failed, falling back to Browser TTS", error.message);
    return null;
  }
};

// Background Worker Processor
const worker = new Worker('commentary-generation', async (job) => {
  const { matchId, liveData, ballEvent } = job.data;
  
  try {
    // 1. Check if AI commentary is enabled for this match
    const hostedGame = await prisma.hostedGame.findUnique({
      where: { id: matchId },
      select: { isAiCommentaryEnabled: true, commentaryVoice: true, commentaryLanguage: true, commentaryStyle: true }
    });

    if (!hostedGame || !hostedGame.isAiCommentaryEnabled) {
      return; // Commentary disabled
    }

    // 2. Generate Text Commentary
    const text = await generateCommentaryText(liveData, ballEvent, hostedGame.commentaryLanguage, hostedGame.commentaryStyle);

    // 3. Optional: Generate Audio with OpenAI TTS
    let audioUrl = null;
    if (hostedGame.commentaryVoice !== 'BROWSER_TTS') {
      audioUrl = await generateOpenAIAudio(text, hostedGame.commentaryVoice);
    }

    // 4. Broadcast the Commentary to Public Views
    const io = getIO();
    if (io) {
      io.to(matchId).emit('COMMENTARY_GENERATED', {
        text,
        audioUrl,
        voice: hostedGame.commentaryVoice,
        language: hostedGame.commentaryLanguage,
      });
    }

    return { success: true, text };
  } catch (error) {
    logger.error("[Commentary] Worker Error:", error);
    throw error;
  }
}, { connection });

worker.on('failed', (job, err) => {
  logger.error(`[Commentary] Job ${job.id} failed with error ${err.message}`);
});

export default { commentaryQueue };
