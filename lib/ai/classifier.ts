// ─────────────────────────────────────────────────────────────
// CLASSIFIER — turns raw intake text (fax / portal message /
// e-prescribe request) into a structured triage decision.
// Uses the Anthropic API when ANTHROPIC_API_KEY is set;
// falls back to a deterministic rules classifier otherwise,
// so the demo never depends on an external service.
// ─────────────────────────────────────────────────────────────
import { callAnthropic } from "../adapters/llm";

export type Blocker =
  | "NO_REFILLS"
  | "NEEDS_VISIT"
  | "MISSING_INFO"
  | "INSURANCE"
  | "CLINICAL_REVIEW"
  | "UNKNOWN";

export interface Classification {
  blocker: Blocker;
  confidence: number; // 0..1
  entities: {
    patient_name?: string;
    medication?: string;
    pharmacy?: string;
    refill_count?: string;
    notes?: string;
  };
  suggested_action: string;
  summary: string;
  source: "llm" | "rules";
}

export async function classifyIntake(raw: string): Promise<Classification> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await llmClassify(raw);
    } catch (e) {
      console.error("[classifier] LLM failed, falling back to rules:", e);
    }
  }
  return ruleBasedClassify(raw);
}

const SYSTEM_PROMPT = `You are a prescription-refill triage classifier for a medical practice.
Read the raw refill request and respond with ONLY a JSON object (no markdown, no prose):
{
  "blocker": one of "NO_REFILLS" | "NEEDS_VISIT" | "MISSING_INFO" | "INSURANCE" | "CLINICAL_REVIEW" | "UNKNOWN",
  "confidence": number between 0 and 1,
  "entities": {
    "patient_name": string or null,
    "medication": string or null,
    "pharmacy": string or null,
    "refill_count": string or null,
    "notes": string or null
  },
  "suggested_action": one short sentence for the human who will decide,
  "summary": one short sentence describing the situation
}
Definitions:
- NO_REFILLS: the prescription has no refills remaining and needs provider approval for a new one.
- NEEDS_VISIT: the patient needs an appointment / is overdue before refilling.
- MISSING_INFO: something is missing or unclear (strength, pharmacy, directions, identity).
- INSURANCE: prior authorization, formulary, or other payer requirement is blocking.
- CLINICAL_REVIEW: the patient's condition or reported symptoms require clinician review.
- UNKNOWN: does not fit any category.
Be conservative: when in doubt, use UNKNOWN with low confidence.`;

async function llmClassify(raw: string): Promise<Classification> {
  const text = await callAnthropic(SYSTEM_PROMPT, raw, 800);
  const json = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(json);
  return {
    blocker: parsed.blocker ?? "UNKNOWN",
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.4,
    entities: parsed.entities ?? {},
    suggested_action: parsed.suggested_action ?? "Manual review required.",
    summary: parsed.summary ?? "Could not summarize.",
    source: "llm",
  };
}

// Deterministic fallback — keyword scoring. Deliberately simple:
// it exists so the demo survives an API outage (resilience story).
function ruleBasedClassify(raw: string): Classification {
  const text = raw.toLowerCase();
  const scores: Record<Exclude<Blocker, "UNKNOWN">, number> = {
    NO_REFILLS: 0,
    NEEDS_VISIT: 0,
    MISSING_INFO: 0,
    INSURANCE: 0,
    CLINICAL_REVIEW: 0,
  };
  const bump = (b: keyof typeof scores, words: string[]) =>
    words.forEach((w) => { if (text.includes(w)) scores[b] += 1; });

  bump("NO_REFILLS", ["no refills", "0 refills", "zero refills", "no refills remain", "out of refills", "refills remaining: 0"]);
  bump("NEEDS_VISIT", ["appointment", "needs to be seen", "overdue", "last visit", "office visit", "follow-up", "followup", "annual visit"]);
  bump("MISSING_INFO", ["missing", "unclear", "unknown", "which strength", "wrong number", "cannot reach", "no pharmacy", "disconnected", "incomplete"]);
  bump("INSURANCE", ["prior authorization", "prior-auth", "formulary", "not covered", "insurance", "payer", "copay", "reject", "rejected", "pa required", "coverage"]);
  bump("CLINICAL_REVIEW", ["dizziness", "side effect", "blood pressure", "symptoms", "feeling", "pain", "dose change", "reaction", "worsening"]);

  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [top, topScore] = entries[0];
  const [, secondScore] = entries[1];
  const blocker: Blocker = topScore === 0 ? "UNKNOWN" : (top as Blocker);
  const confidence = blocker === "UNKNOWN" ? 0.35 : Math.min(0.85, 0.5 + 0.15 * (topScore - secondScore) + 0.05 * topScore);

  const medMatch = raw.match(/(?:refill(?:ing)?|for)\s+([A-Z][a-zA-Z0-9-]{2,30})/);
  const nameMatch = raw.match(/(?:patient|name|for)\s*[:\-]?\s*([A-Z][a-z]+ [A-Z][a-z]+)/);

  return {
    blocker,
    confidence: Number(confidence.toFixed(2)),
    entities: {
      patient_name: nameMatch?.[1],
      medication: medMatch?.[1],
      pharmacy: undefined,
      notes: raw.slice(0, 200),
    },
    suggested_action:
      blocker === "UNKNOWN"
        ? "Route to human triage."
        : `Review and confirm the '${blocker}' classification, then route appropriately.`,
    summary: `Rules classifier detected likely blocker: ${blocker}.`,
    source: "rules",
  };
}
