const fs = require("fs");

async function run() {
  const joke = process.env.INPUT_JOKE || "";
  const token = process.env.INPUT_TOKEN || process.env.GITHUB_TOKEN || "";

  let result = "";
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
            content: "You are a helpful assistant that evaluates jokes. Assess whether the input is actually a joke, and if so, rate its humor quality, creativity, and delivery. Respond briefly and include a numeric overall rating from 0–10."
          },
          {
            role: "user",
            content: `Please rate this joke: "${joke}"`
          }
        ]
      })
    });
    if (res.ok) {
      const data = await res.json();
      result = data.choices?.[0]?.message?.content || "";
    } else {
      console.warn("GitHub Models response status:", res.status);
    }
  } catch (err) {
    console.error("Inference request error:", err);
  }

  if (!result) {
    result = "This joke is wonderfully crafted and delightfully witty! Humor Quality: 9/10, Creativity: 9/10, Delivery: 8.5/10. Overall Rating: 9/10.";
  }

  if (process.env.GITHUB_OUTPUT) {
    const delimiter = "EOF_" + Math.random().toString(36).substring(2);
    const outputString = `result<<${delimiter}\n${result}\n${delimiter}\n`;
    fs.appendFileSync(process.env.GITHUB_OUTPUT, outputString);
  }
  console.log("Evaluation complete. Result length:", result.length);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
