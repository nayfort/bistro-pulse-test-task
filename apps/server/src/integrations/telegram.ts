import { config } from "../config.js";

export async function sendTelegramAlert(message: string) {
  if (!config.telegram.botToken || !config.telegram.chatId) {
    return { skipped: true };
  }

  const endpoint = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      chat_id: config.telegram.chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram alert failed: ${response.status}`);
  }

  return { skipped: false };
}

