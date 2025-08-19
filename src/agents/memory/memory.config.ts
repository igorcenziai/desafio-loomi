;import { ChatOpenAI } from "@langchain/openai"
import { ConversationSummaryBufferMemory } from "langchain/memory"

export const MEMORY_CONFIG = {

    MAX_CONVERSATION_HISTORY: 10,
    CONTEXT_WINDOW: 10,

    MEMORY_TOKEN_LIMIT: 2000,
    
    SESSION_TIMEOUT_HOURS: 24, 
    MAX_SESSIONS: 1000, 

    AUTO_CLEANUP_ENABLED: true,
    CLEANUP_INTERVAL_MINUTES: 60, 
}

export interface SessionData {
    conversationHistory: Array<{
        role: 'user' | 'assistant'
        content: string
        timestamp: Date
    }>
    lastActivity: Date
}

export class ConversationMemoryManager {
    private sessions: Map<string, SessionData> = new Map()
    private cleanupInterval?: NodeJS.Timeout

    constructor() {
        if (MEMORY_CONFIG.AUTO_CLEANUP_ENABLED) {
            this.startAutoCleanup()
        }
    }

    getSession(sessionId: string): SessionData {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, {
                conversationHistory: [],
                lastActivity: new Date()
            })
        }
        
        const session = this.sessions.get(sessionId)!
        session.lastActivity = new Date()
        
        return session
    }

    addMessage(sessionId: string, role: 'user' | 'assistant', content: string) {
        const session = this.getSession(sessionId)
        session.conversationHistory.push({
            role,
            content,
            timestamp: new Date()
        })
        
        if (session.conversationHistory.length > MEMORY_CONFIG.MAX_CONVERSATION_HISTORY) {
            session.conversationHistory = session.conversationHistory.slice(-MEMORY_CONFIG.MAX_CONVERSATION_HISTORY)
        }
    }

    getConversationContext(sessionId: string): string {
        const session = this.getSession(sessionId)
        
        if (session.conversationHistory.length === 0) {
            return ""
        }

        const contextWindow = session.conversationHistory.slice(-MEMORY_CONFIG.CONTEXT_WINDOW)
        
        let context = "=== HISTÓRICO DAS CONVERSAS ANTERIORES ===\n"
        
        contextWindow.forEach((msg, index) => {
            const timeAgo = this.getTimeAgo(msg.timestamp)
            context += `[${timeAgo}] ${msg.role === 'user' ? 'Cliente' : 'Maria'}: ${msg.content}\n`
        })

        context += "\n=== INSTRUÇÕES PARA USO DO HISTÓRICO ===\n"
        context += "- Use este histórico para manter continuidade na conversa\n"
        context += "- Referencie tópicos anteriores quando relevante: 'Como conversamos antes...'\n"
        context += "- Mantenha consistência com informações já fornecidas\n"
        context += "- Se o cliente mencionar algo vago, use o contexto para entender melhor\n\n"

        return context
    }

    getConversationHistory(sessionId: string): Array<{role: 'user' | 'assistant', content: string, timestamp: Date}> {
        const session = this.getSession(sessionId)
        return session.conversationHistory.slice(-MEMORY_CONFIG.CONTEXT_WINDOW)
    }

    clearSession(sessionId: string) {
        if (this.sessions.has(sessionId)) {
            this.sessions.delete(sessionId)
        }
    }

    getSessionStats(sessionId: string) {
        if (!this.sessions.has(sessionId)) {
            return null
        }

        const session = this.sessions.get(sessionId)!
        return {
            totalMessages: session.conversationHistory.length,
            lastActivity: session.lastActivity,
            sessionDuration: session.conversationHistory.length > 0 && session.conversationHistory[0]
                ? Date.now() - session.conversationHistory[0].timestamp.getTime()
                : 0,
            isActive: (Date.now() - session.lastActivity.getTime()) < (MEMORY_CONFIG.SESSION_TIMEOUT_HOURS * 60 * 60 * 1000)
        }
    }

    hasHistory(sessionId: string): boolean {
        const session = this.sessions.get(sessionId)
        return session ? session.conversationHistory.length > 0 : false
    }

    getSystemStats() {
        const now = Date.now()
        const activeSessions = Array.from(this.sessions.values())
            .filter(session => (now - session.lastActivity.getTime()) < (MEMORY_CONFIG.SESSION_TIMEOUT_HOURS * 60 * 60 * 1000))

        return {
            totalSessions: this.sessions.size,
            activeSessions: activeSessions.length,
            inactiveSessions: this.sessions.size - activeSessions.length,
            totalMessages: Array.from(this.sessions.values())
                .reduce((total, session) => total + session.conversationHistory.length, 0)
        }
    }

    private startAutoCleanup() {
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldSessions()
        }, MEMORY_CONFIG.CLEANUP_INTERVAL_MINUTES * 60 * 1000)
    }

    private cleanupOldSessions() {
        const now = Date.now()
        const maxAge = MEMORY_CONFIG.SESSION_TIMEOUT_HOURS * 60 * 60 * 1000
        
        let cleanedCount = 0
        
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.lastActivity.getTime() > maxAge) {
                this.sessions.delete(sessionId)
                cleanedCount++
            }
        }

        if (cleanedCount > 0) {
            console.log(`[ConversationMemory] Limpeza automática: ${cleanedCount} sessões removidas`)
        }
    }

    private getTimeAgo(timestamp: Date): string {
        const now = new Date()
        const diffMs = now.getTime() - timestamp.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))
        
        if (diffMins < 1) return 'agora'
        if (diffMins < 60) return `${diffMins}min atrás`
        
        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours}h atrás`
        
        const diffDays = Math.floor(diffHours / 24)
        return `${diffDays}d atrás`
    }

    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval)
        }
    }
}

export function createLangChainMemory(llm: ChatOpenAI) {
    return new ConversationSummaryBufferMemory({
        llm,
        maxTokenLimit: MEMORY_CONFIG.MEMORY_TOKEN_LIMIT,
        returnMessages: true,
        memoryKey: "chat_history",
    })
}

export const conversationMemory = new ConversationMemoryManager()

export const memoryHelpers = {

    addUserMessage: (sessionId: string, message: string) => {
        conversationMemory.addMessage(sessionId, 'user', message)
    },

    addAssistantMessage: (sessionId: string, message: string) => {
        conversationMemory.addMessage(sessionId, 'assistant', message)
    },

    getContext: (sessionId: string) => {
        return conversationMemory.getConversationContext(sessionId)
    },

    isFirstConversation: (sessionId: string) => {
        return !conversationMemory.hasHistory(sessionId)
    },

    clearHistory: (sessionId: string) => {
        conversationMemory.clearSession(sessionId)
    }
}