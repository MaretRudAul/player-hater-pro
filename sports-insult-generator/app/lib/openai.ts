import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

interface PlayerStats {
  [key: string]: string | number | boolean | null;
}

export const generateInsults = async (
  playerName: string,
  playerStats: PlayerStats,
  playerBio: string,
  recentNews: string[]
): Promise<string[]> => {
  const prompt = `
Generate 5 creative, humorous, and playfully sarcastic insults for ${playerName}, a professional athlete.

Player Information:
- Stats: ${JSON.stringify(playerStats)}
- Background: ${playerBio}
- Recent News: ${recentNews.join(', ')}

Guidelines:
- Keep insults sports-related and performance-based
- Use stats, college, hometown, or recent news as material
- Make them witty but not mean-spirited or personal attacks
- Avoid anything related to appearance, family, or sensitive topics
- Focus on performance, team loyalty, career moves, or funny incidents
- Each insult should be 1-2 sentences maximum
- Make them quotable and shareable

Format as a JSON array of 5 strings.
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('No response from OpenAI')

    return JSON.parse(content)
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw new Error('Failed to generate insults')
  }
}

export default openai
