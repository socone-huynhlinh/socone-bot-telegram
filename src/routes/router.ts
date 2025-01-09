import TelegramBot, { Message, CallbackQuery } from "node-telegram-bot-api";

type RouteHandler = (msg: Message, bot: TelegramBot) => void;
type CallbackHandler = (query: CallbackQuery, bot: TelegramBot) => void;

class Router {
  private routes: Map<string, RouteHandler> = new Map();
  private callbacks: Map<string, CallbackHandler> = new Map();
  private userStates: Map<number, string> = new Map();
  private userData: Map<number, Record<string, any>> = new Map();

  constructor(private bot: TelegramBot) {}

  addRoute(path: string, handler: RouteHandler): void {
    this.routes.set(path, handler);
  }

  addCallback(path: string, handler: CallbackHandler): void {
    this.callbacks.set(path, handler);
  }
  setUserData(chatId: number, key: string, value: any): void {
    const data = this.userData.get(chatId) || {};
    data[key] = value;
    this.userData.set(chatId, data);
  }
  getUserData(chatId: number): Record<string, any> | undefined {
    return this.userData.get(chatId);
  }
  setUserState(chatId: number, state: string): void {
    console.log(`Setting user state: ${chatId} -> ${state}`);
    this.userStates.set(chatId, state);
  }
  

  getUserState(chatId: number): string | undefined {
    const state = this.userStates.get(chatId);
    console.log(`Getting user state: ${chatId} -> ${state}`);
    return state;
  }
  

  clearUserState(chatId: number): void {
    this.userStates.delete(chatId);
  }

  handleMessage(msg: Message): void {
    const text = msg.text || "";
    const chatId = msg.chat.id;
    const handler = this.routes.get(text);
    const state = this.getUserState(chatId);
    if(state && this.routes.has(state)){
      const handler = this.routes.get(state);
      if(handler){
        handler(msg, this.bot);
        return;
      }
    }
    if (handler) {
      handler(msg, this.bot);
    }
  }
  handleCallback(query: CallbackQuery): void {
    const data = query.data || "";
    console.log(`Received callback data: ${data}`);
  
    const matchedPrefix = Array.from(this.callbacks.keys()).find((key) => data.startsWith(key));
    if (matchedPrefix) {
      console.log(`Handler found for prefix: ${matchedPrefix}`);
      const handler = this.callbacks.get(matchedPrefix);
      if (handler) {
        handler(query, this.bot);
      }
    } else {
      console.warn(`No handler found for callback data: ${data}`);
    }
  }
  
}

export default Router;
