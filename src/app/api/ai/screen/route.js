import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "AI screening not configured." }, { status: 503 });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const { applicationId, applicationData } = await request.json();

    if (!applicationId || !applicationData) {
      return NextResponse.json({ error: "applicationId and applicationData are required" }, { status: 400 });
    }

    const prompt = buildPrompt(applicationData);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a university admissions screening assistant. Evaluate applications fairly. You MUST respond with a raw JSON object only — no markdown, no code fences, no explanation. Just the JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";

    let result;
    try {
      // Strip markdown code fences if the model wraps output anyway
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    const score = Math.min(100, Math.max(0, Number(result.score) || 0));
    const recommendation = validateRecommendation(result.recommendation);
    const flags = Array.isArray(result.flags) ? result.flags.slice(0, 5) : [];
    const summary = typeof result.summary === "string" ? result.summary.slice(0, 500) : "";

    return NextResponse.json({
      success: true,
      applicationId,
      screening: {
        score,
        recommendation,
        flags,
        summary,
        modelUsed: "gpt-3.5-turbo",
      },
    });
  } catch (error) {
    console.error("AI screen error:", error);
    return NextResponse.json({ error: error.message || "Screening failed" }, { status: 500 });
  }
}

function buildPrompt(app) {
  // Support both flat fields (student form) and nested objects (agent form)
  const p = app.personalInfo  || {};
  const a = app.academicInfo  || {};
  const c = app.courseInfo    || {};

  const university  = app.selectedUniversity || app.universityName || app.university || c.universityName || "Not specified";
  const course      = app.courseName || c.courseName || app.course || "Not specified";
  const qualification = app.highestQualification || a.highestQualification || "Not specified";
  const institution = app.institutionName || a.institutionName || "Not specified";
  const gpa         = app.gpaGrade || a.gpaGrade || "Not specified";
  const gradYear    = app.graduationYear || a.graduationYear || "Not specified";
  const nationality = app.nationality || p.nationality || "Not specified";
  const statement   = app.personalStatement || app.statement || "Not provided";
  const { docsCount, docsSummary } = summariseDocuments(app);

  return `Evaluate this university application. Return ONLY a JSON object with these exact keys:
{
  "score": <integer 0-100>,
  "recommendation": <"Strong Candidate" | "Average Candidate" | "Weak Candidate">,
  "flags": [<up to 5 short strings>],
  "summary": <one paragraph, max 3 sentences, for the admissions reviewer>
}

Application:
University: ${university}
Course: ${course}
Nationality: ${nationality}
Qualification: ${qualification}
Institution: ${institution}
Graduation year: ${gradYear}
GPA: ${gpa}
Documents (${docsCount}/4 provided): ${docsSummary}
Personal statement: ${statement}

Score guide: 80-100 strong academics + complete docs + clear motivation; 50-79 adequate with some gaps; 0-49 weak or incomplete.`;
}

function summariseDocuments(app) {
  const REQUIRED = {
    passport:     "Passport/ID",
    transcript:   "Academic Transcript",
    certificates: "Certificates",
    englishTest:  "English Language Test",
  };

  const docs = app._studentDocuments || app.documents || app.uploadedDocuments || app.studentDocuments || {};

  const provided = [];
  const missing  = [];

  for (const [key, label] of Object.entries(REQUIRED)) {
    const val = Array.isArray(docs) ? null : docs[key];
    const isProvided = val && val !== false &&
      !(typeof val === "object" && val.provided === false);
    if (isProvided) provided.push(label);
    else missing.push(label);
  }

  const docsCount = provided.length;
  const docsSummary = docsCount === 4
    ? "All 4 required documents provided"
    : `Provided: ${provided.join(", ") || "none"}. Missing: ${missing.join(", ")}`;

  return { docsCount, docsSummary };
}

function validateRecommendation(value) {
  const valid = ["Strong Candidate", "Average Candidate", "Weak Candidate"];
  return valid.includes(value) ? value : "Average Candidate";
}
