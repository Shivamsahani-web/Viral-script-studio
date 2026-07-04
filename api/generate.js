export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { niche, topic, platform, tone, language, duration } = req.body || {};

  if (!niche || !topic) {
    res.status(400).json({ error: "niche and topic are required" });
    return;
  }

  const platformLabels = { reels: "Reels / Shorts", youtube: "YouTube Video" };
  const toneLabels = {
    energetic: "Energetic",
    storytelling: "Storytelling",
    emotional: "Emotional",
    educational: "Educational",
    funny: "Funny",
  };
  const langLabels = { hinglish: "Hinglish", hindi: "Hindi", english: "English" };
  const durationLabels = {
    "15-30s": "15–30s",
    "30-60s": "30–60s",
    "1-3min": "1–3 min",
    "3-5min": "3–5 min",
  };

  const prompt = `You are an elite short-form video scriptwriter who has written scripts that got 50M+ views on Instagram Reels and YouTube Shorts. Write ONE complete, camera-ready, HUMAN-SOUNDING video script. Never generic, never templated, no filler, no corporate tone. Write like a real creator talking to camera.

DETAILS:
- Niche: ${niche}
- Topic / idea: ${topic}
- Platform: ${platformLabels[platform] || platform}
- Tone: ${toneLabels[tone] || tone}
- Language: ${langLabels[language] || language} (write the actual script content in this language/style)
- Target duration: ${durationLabels[duration] || duration}

RULES:
1. The hook (first 3 seconds) must create a curiosity gap, pattern interrupt, or bold claim — something that stops the scroll. No "Hey guys" or "In this video". Give 3 different strong hook options.
2. Break the script into a realistic timeline with timestamps that add up to roughly the target duration. Each beat should have a short label (like HOOK, PROBLEM, TWIST, PROOF, PAYOFF, CTA) and the actual spoken lines a creator would say — natural, punchy, specific to the topic, not generic advice.
3. End with a strong CTA line designed for retention/engagement (comment, follow, save, watch till end callback etc), matching the tone.
4. Write a short, thumb-stopping caption for the post (1-3 lines) and 6-10 relevant hashtags (mix of broad + niche).
5. Everything must feel specific to "${topic}" in the "${niche}" niche — no placeholder text like [insert example].

Return ONLY raw JSON, no markdown code fences, no commentary, matching exactly this shape:
{
  "hooks": ["hook option 1", "hook option 2", "hook option 3"],
  "timeline": [
    {"time": "0:00-0:03", "label": "HOOK", "content": "..."},
    {"time": "0:03-0:10", "label": "...", "content": "..."}
  ],
  "cta": "final CTA line",
  "caption": "post caption",
  "hashtags": ["#tag1", "#tag2"]
}`;

  try {
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      res.status(502).json({ error: "Upstream API error" });
      return;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    res.status(200).json(parsed);
  } catch (err) {
    console.error("Generate function error:", err);
    res.status(500).json({ error: "Script generation failed" });
  }
  }
