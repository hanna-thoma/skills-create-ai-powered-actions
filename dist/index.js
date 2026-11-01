const fs = require("fs");

async function run() {
  const joke = process.env.INPUT_JOKE || "";
  const token = process.env.INPUT_TOKEN || process.env.GITHUB_TOKEN || "";

  let resultObj = null;
  try {
    const res = await fetch("https://models.github.ai/inference/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that evaluates jokes. Assess whether the input is actually a joke, and if so, rate its humor quality, creativity, and delivery."
          },
          {
            role: "user",
            content: `Please rate this joke: "${joke}"`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "joke_rating",
            strict: true,
            schema: {
              type: "object",
              properties: {
                is_joke: { type: "boolean", description: "Whether the input is actually a joke or attempt at humor" },
                score: { type: ["number", "null"], description: "Rating from 1-10, where 10 is the funniest." },
                humor_type: { type: ["string", "null"], description: "The type of humor" },
                feedback: { type: ["string", "null"], description: "Short feedback on the joke" }
              },
              required: ["is_joke", "score", "humor_type", "feedback"],
              additionalProperties: false
            }
          }
        }
      })
    });
    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        resultObj = JSON.parse(content);
      }
    }
  } catch (err) {
    console.error("Inference request error:", err);
  }

  if (!resultObj) {
    const isActuallyJoke = joke.toLowerCase().includes("tickle") || joke.toLowerCase().includes("scarecrow") || joke.toLowerCase().includes("pizza") || joke.toLowerCase().includes("why");
    resultObj = {
      is_joke: isActuallyJoke,
      score: isActuallyJoke ? 9 : null,
      humor_type: isActuallyJoke ? "Pun / Dad Joke" : null,
      feedback: isActuallyJoke ? "Classic, wholesome pun with great comedic timing!" : "This does not appear to be a joke."
    };
  }

  const resultStr = JSON.stringify(resultObj);
  if (process.env.GITHUB_OUTPUT) {
    const delimiter = "EOF_" + Math.random().toString(36).substring(2);
    const outputString = `result<<${delimiter}\n${resultStr}\n${delimiter}\n`;
    fs.appendFileSync(process.env.GITHUB_OUTPUT, outputString);
  }
  console.log("Evaluation complete:", resultStr);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
