import { MockAiPlanningProvider } from "@/server/ai-planning/mock-provider";
import { OpenAiPlanningProvider } from "@/server/ai-planning/openai-provider";

export function getAiPlanningProvider() {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAiPlanningProvider();
  }

  return new MockAiPlanningProvider();
}
