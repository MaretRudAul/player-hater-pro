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
  const prompt = (process.env.AI_PROMPT || '') + `
Generate 5 creative, extremely vile and mean, extremely concise insults for ${playerName}, a professional athlete.

Player Information:
- Stats: ${JSON.stringify(playerStats)}
- Background: ${playerBio}
- Recent News: ${recentNews.join(', ')}

Guidelines:
- Keep insults sports-related and performance-based
- Use stats, college, hometown, or recent news as material. This is extremely important. Make it personal to their sports career. Use specific numbers
- Avoid anything related to appearance, family, or sensitive topics
- Focus on performance, team loyalty, career moves, or funny incidents
- Each insult should be 1 sentences maximum
- Make them quotable and shareable
- Avoid any concepts or statements that could be seen as defamatory. This is of the utmost importance, more than any other requirement.
- These insults should be in the second person, directed at the player. Ideal for shouting at them from the sideline of a sports game. This is important.
- Try to be as vile as possible. Like league of legends toxicity.

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
