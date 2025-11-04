import { GoogleGenAI, Type } from '@google/genai';
import type { Order, MicrogreenVariety, SeedInventory, MicrogreenVarietyName } from '../types';
import { OrderStatus } from '../types';

export interface SowingSuggestion {
    suggestion: string;
    reason: string;
}

export const getSowingSuggestions = async (
    orders: Order[],
    microgreenVarieties: MicrogreenVariety[],
    seedInventory: SeedInventory
): Promise<SowingSuggestion[] | null> => {

    const completedOrders = orders.filter(o => o.status === OrderStatus.Completed);
    if (completedOrders.length < 5) {
        // Not enough data for a meaningful analysis
        return [];
    }
    
    // 1. Summarize historical data
    const salesCounts: Record<MicrogreenVarietyName, number> = {};
    completedOrders.forEach(order => {
        order.items.forEach(item => {
            salesCounts[item.variety] = (salesCounts[item.variety] || 0) + item.quantity;
        });
    });
    const top5Varieties = Object.entries(salesCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, quantity]) => ({ variety: name, totalBoxesSold: quantity }));

    // 2. Identify low stock seeds
    const lowStockSeeds = Object.entries(seedInventory)
        .filter(([, item]) => item.stockOnHand <= item.reorderLevel)
        .map(([name]) => name);

    // 3. Prepare variety list with growth cycles
    const varietyInfo = microgreenVarieties.map(({ name, growthCycleDays }) => ({ name, growthCycleDays }));
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        You are an expert agricultural advisor for a microgreens farm. Your goal is to help the farmer decide what to sow today to maximize profit and meet future demand.

        Analyze the following data:
        1.  **Top 5 Best-Selling Varieties (Historical):** ${JSON.stringify(top5Varieties)}
        2.  **Varieties with Low Seed Stock:** ${JSON.stringify(lowStockSeeds)}
        3.  **Full List of Available Varieties and their Growth Cycles (in days):** ${JSON.stringify(varietyInfo)}

        Based on this data, generate 3 to 5 actionable and specific sowing suggestions for today. Your suggestions should be creative and strategic. Consider things like:
        -   Sowing consistently popular items to maintain stock.
        -   Suggesting a "grower's choice" or "specialty mix" if several items are popular.
        -   Advising to re-order seeds for low-stock items *before* suggesting to sow them, or suggesting to sow a smaller "test batch".
        -   Suggesting to sow a less popular item to test the market or use up aging seeds (hypothetically).
        -   Your suggestions should be phrased as direct commands, e.g., "Sow 5 trays of Sunflower."

        Provide the output in a structured JSON format. The JSON must be an array of objects.
        Each object must have two keys: "suggestion" (a string with the specific action) and "reason" (a string explaining the business logic behind the suggestion).
        The final output must be only the JSON array, with no other text or markdown formatting.
    `;

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                suggestion: { type: Type.STRING },
                reason: { type: Type.STRING }
            },
            required: ['suggestion', 'reason']
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.4,
            },
        });

        const text = response.text.trim();
        if (text) {
            return JSON.parse(text) as SowingSuggestion[];
        }
        return null;
    } catch (error) {
        console.error("Error generating sowing suggestions:", error);
        throw new Error("Failed to communicate with the AI advisor service.");
    }
};
