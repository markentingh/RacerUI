using OpenAI.Chat;
using RacerUI.Models;

namespace RacerUI
{
    public static class LLMs
    {
        public enum Models
        {
            Unknown, Qwen, ChatGPT, Gemini, Claude
        }

        /// <summary>
        /// The preferred model is set by the user to determine which model should be used in any given situation
        /// </summary>
        public static Models PreferredModel { get; set; } = Models.Qwen;

        public static Dictionary<Models, LLMInfo> Available = new Dictionary<Models, LLMInfo>()
        {
            {Models.Qwen, new LLMInfo(){
                Model = "qwen-plus",
                Endpoint = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
                PrivateKey = ""
            }},
            {Models.ChatGPT, new LLMInfo(){
                Model = "gpt-4o-mini",
                Endpoint = "https://api.openai.com/v1",
                PrivateKey = ""
            }},
            {Models.Gemini, new LLMInfo(){
                Model = "gemini-2.0-flash-lite",
                Endpoint = "https://generativelanguage.googleapis.com/v1beta/openai/",
                PrivateKey = ""
            }},
            {Models.Claude, new LLMInfo(){
                Model = "claude-sonnet-4-5",
                Endpoint = "https://api.anthropic.com/v1/",
                PrivateKey = ""
            }}
        };

        public static async Task<string> Prompt(string system, string assistant, string user, Models llm = Models.Unknown)
        {
            var preferredModel = llm != Models.Unknown ? llm : PreferredModel;
            var myLLM = Available[preferredModel];
            if (string.IsNullOrEmpty(myLLM.PrivateKey))
            {
                throw new Exception("LLM private key is missing");
            }
            ChatClient client = new ChatClient(myLLM.Model, new System.ClientModel.ApiKeyCredential(myLLM.PrivateKey), new OpenAI.OpenAIClientOptions()
            {
                Endpoint = new Uri(myLLM.Endpoint)
            });

            List<ChatMessage> prompt = new List<ChatMessage>()
            {
                new SystemChatMessage(system),
                new AssistantChatMessage(assistant),
                new UserChatMessage(user)
            };
            var results = await client.CompleteChatAsync(prompt);
            return results.Value.Content[0].Text;
        }
    }
}
