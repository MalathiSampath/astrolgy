# Astrology Prediction Website (AI + n8n)

## Project description

This project is a small, end‑to‑end Astrology Prediction Website that:

- Collects structured user details through a frontend form.
- Sends those details to an **n8n** automation workflow via webhook.
- Uses an **LLM acting as a careful, ethical astrologer** to generate a readable reflection.
- Emails the result back to the user with a clear disclaimer and responsible‑use framing.

The goal is to demonstrate transparent, responsible use of AI in an astrology‑style context rather than hiding the logic.

Tech stack:

- **Frontend**: HTML, CSS, vanilla JavaScript (works on GitHub Pages).
- **Automation**: n8n self‑hosted or cloud.
- **AI**: OpenAI Chat API (can be swapped for another LLM provider).

---

## Architecture overview

High‑level flow:

1. **User** opens the Astrology Prediction Website (hosted on GitHub Pages).
2. User fills in:
   - Full name
   - Date of birth
   - Time of birth (optional)
   - Place of birth
   - Gender (optional)
   - Area of focus (career, health, relationships, etc.)
   - Email address
   - Optional extra context
3. The frontend **validates** the input and sends it as JSON to an **n8n Webhook**.
4. n8n:
   - Prepares a **prompt** that combines user data + clear AI safety rules.
   - Calls an **LLM** to generate a structured astrology‑style reflection.
   - Builds an **email body** that includes the reflection and a disclaimer.
   - Sends the email back to the user via SMTP.
5. The webhook responds to the frontend with a small JSON confirmation, and the user sees a success message.

Key files:

- `index.html` – main UI and form.
- `style.css` – layout and visual design.
- `script.js` – validation + webhook call.
- `n8n-workflow.json` – exported n8n workflow.

---

## Frontend → n8n data flow

### Data collected on the frontend

The form collects:

- `fullName` (required)
- `email` (required)
- `dateOfBirth` (required, HTML date input)
- `timeOfBirth` (optional, HTML time input)
- `placeOfBirth` (required)
- `gender` (optional, select)
- `focusArea` (required, select – e.g. `career`, `health`, `relationships`, `personal_growth`, `finances`, `general`)
- `extraContext` (optional, free‑text)
- `source` (added by JavaScript to indicate frontend version)

### Client‑side validation

In `script.js`:

- Checks for required fields (name, email, date of birth, place of birth, focus area, consent).
- Email is validated with a simple regex.
- Consent checkbox must be ticked:
  > “I understand that these predictions are for reflection and guidance only…”
- Errors are shown inline, and fields with issues are highlighted.

### Sending data to n8n

`script.js` sends a POST request:

- URL: `window.N8N_WEBHOOK_URL` (configured in `index.html`)
- Method: `POST`
- Headers: `Content-Type: application/json`
- Body: JSON payload containing the fields listed above.

Example (simplified):

```json
{
  "fullName": "Ada Lovelace",
  "email": "ada@example.com",
  "dateOfBirth": "1815-12-10",
  "timeOfBirth": "08:30",
  "placeOfBirth": "London, UK",
  "gender": "female",
  "focusArea": "career",
  "extraContext": "Curious about long-term creative projects.",
  "source": "astrology-prediction-site-v1"
}
```

The webhook node in n8n is configured with path `astrology-insight`, so the public URL looks like:

`https://YOUR-N8N-DOMAIN/webhook/astrology-insight`

This exact URL must be set in `index.html`:

```html
<script>
  window.N8N_WEBHOOK_URL = "https://YOUR-N8N-DOMAIN/webhook/astrology-insight";
</script>
```

---

## n8n workflow explanation

The exported workflow is in `n8n-workflow.json`. It contains the following key nodes:

1. **Webhook** (`Webhook`)
   - Method: `POST`
   - Path: `astrology-insight`
   - Responds immediately with JSON:
     ```json
     {
       "success": true,
       "message": "Request received. You will get an email shortly."
     }
     ```

2. **Prepare Prompt** (`Function` node)
   - Reads the incoming JSON fields from the webhook.
   - Maps the `focusArea` code to a readable description (e.g. `career` → “career, vocation, and professional direction”).
   - Constructs:
     - `systemPrompt`: strict rules for responsible, non‑fatalistic astrology‑style output.
     - `userPrompt`: formatted text with all user details and a required output structure (introduction, key themes, focus area insights, prompts, closing + disclaimer).

3. **AI Astrologer** (`OpenAI Chat` node)
   - Uses the prepared `systemPrompt` and `userPrompt`.
   - Model example: `gpt-4o-mini` (can be replaced).
   - Returns a Markdown‑formatted reflection that already contains a disclaimer section.

4. **Build Email** (`Function` node)
   - Combines:
     - User name and email.
     - AI‑generated content.
   - Wraps the AI output with:
     - A warm greeting.
     - A short explanation that an AI model generated the content.
     - A closing disclaimer emphasizing guidance, free will, and no professional advice.

5. **Send Email** (`Email Send` node)
   - Uses your SMTP credentials.
   - Sends plain‑text email with subject like:
     > `Astrology Insight for Ada Lovelace`
   - Recipient: email address provided in the form.

### Importing and configuring the workflow

1. Open your n8n instance.
2. Create a new workflow and use **Import from File** with `n8n-workflow.json`.
3. Configure credentials:
   - **OpenAI API** (or another provider if you swap the node):
     - Add your API key as a credential and select it in the **AI Astrologer** node.
   - **SMTP**:
     - Configure your email provider (e.g. Gmail SMTP, SendGrid SMTP, etc.).
4. Activate the workflow so that the webhook URL becomes live.
5. Copy the production webhook URL and paste it into `index.html` (`window.N8N_WEBHOOK_URL`).

---

## Responsible AI usage

This project was designed with responsible AI use in mind:

- **Clear prompt design**:
  - System prompt explicitly forbids:
    - Absolute/fatalistic claims.
    - Medical, legal, or financial advice.
    - Extreme or harmful language.
  - Output must:
    - Use possibilities and tendencies, not certainties.
    - Include a readable disclaimer at the end.
    - Encourage self‑reflection and personal judgment.
- **Transparency**:
  - The UI clearly states that the project is an AI‑powered demo.
  - The email body explains that an AI model generated the reflection.
- **Human oversight**:
  - The workflow is simple and auditable.
  - Prompts and code are visible in this repository for review.
  - You can add manual review nodes in n8n (e.g. a waiting state or approval step) if you want a human to approve content before sending.
- **Limitations**:
  - No real astrological chart calculations are performed (this is a symbolic/reflective tool, not traditional astrology software).
  - Output quality depends on the underlying LLM and prompt design.
  - Not intended for high‑risk domains (e.g. medical diagnosis, financial investments, crisis support).

---

## Known limitations and assumptions

- **Astrology logic**:
  - The “astrologer” is an LLM guided by prompts, not a traditional ephemeris‑based engine.
  - All interpretations are high‑level and symbolic.
- **Time & place of birth**:
  - Collected mainly as context for the LLM, not as precise astronomical coordinates.
- **Deliverability**:
  - Email success depends on SMTP configuration and spam filters.
- **Privacy**:
  - This demo does not implement full data protection/HIPAA/GDPR policies.
  - Do not use it in production with sensitive data without adding proper security and compliance measures.

---

## How to run and deploy

### 1. Local preview

1. Clone or download this repository.
2. Open `index.html` directly in your browser, or serve it via a simple static server.
3. Set `window.N8N_WEBHOOK_URL` in `index.html` to your n8n webhook URL.
4. Submit the form and check that:
   - n8n receives the data.
   - The workflow runs successfully.
   - You receive the email.

### 2. Deploy to GitHub Pages

1. Create a new public GitHub repository.
2. Add these files:
   - `index.html`
   - `style.css`
   - `script.js`
   - `n8n-workflow.json`
   - `README.md`
3. Commit and push to GitHub.
4. In the repository settings:
   - Go to **Pages**.
   - Choose source: `Deploy from a branch`.
   - Select branch: `main` (or `master`), folder: `/ (root)`.
5. Save and wait for GitHub Pages to build.
6. Your live site URL will appear (e.g. `https://your-username.github.io/astrology-prediction`).

Make sure `window.N8N_WEBHOOK_URL` points to a publicly reachable n8n instance before sharing the URL.

---

## What to submit

For the assignment, you should submit:

- **Public GitHub repository link**  
  Contains the frontend code, README, and `n8n-workflow.json`.

- **Live hosted project URL (GitHub Pages)**  
  Shows the working astrology form and UX.

- **n8n workflow proof**  
  - `n8n-workflow.json` in the repo (this file), and/or  
  - Screenshots from n8n showing:
    - The node canvas / workflow graph.
    - Example execution with input and output.

This README doubles as documentation of:

- Project description
- Architecture overview
- Frontend → n8n data flow
- AI usage and safeguards
- Limitations and assumptions

