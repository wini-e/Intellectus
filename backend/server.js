import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(bodyParser.json());

app.post("/notify", async (req, res) => {
  const { to, subject, message } = req.body;

  try {
    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MAILERSEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: {
          email: process.env.MAILERSEND_FROM
        },
        to: [
          { email: to }
        ],
        subject,
        text: message
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(500).json({ error });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, () => console.log("MailerSend server running on http://localhost:4000"));
