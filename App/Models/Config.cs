using System.Text.Json.Serialization;

namespace RacerUI.Models
{
    public class Config
    {
        public ConfigAdmin Admin { get; set; }
        public ConfigLLM LLM { get; set; }
    }

    public class ConfigAdmin
    {
        public string Username { get; set; }
        public string Pass { get; set; }
    }

    public class LLMConfig
    {
        public string PrivateKey { get; set; }
    }

    public class ConfigLLM
    {
        public LLMConfig Qwen { get; set; }
        public LLMConfig ChatGPT { get; set; }
        public LLMConfig Gemini { get; set; }
        public LLMConfig StabilityAI { get; set; }
    }
}
