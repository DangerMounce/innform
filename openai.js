import OpenAI from 'openai';
import dotenv from 'dotenv';
import { prompt } from './prompts.js';
dotenv.config();

const openAIClient = new OpenAI({
    openAiApiKey: process.env['OPENAI_API_KEY']
});


async function getTheCourseTitle(userInput) {
    const chatCompletion = await openAIClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'user', content: `${prompt.whatIsTheCourseName}.  User input: ${userInput}` }
        ]
    })
    const completionText = chatCompletion.choices[0].message.content
    return completionText
}

export const ai = {
    getTheCourseTitle
}