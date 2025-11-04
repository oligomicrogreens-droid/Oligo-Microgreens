import { GoogleGenAI, Type } from '@google/genai';
import type { Order, ForecastData } from '../types';
import { OrderStatus } from '../types';

export const getDemandForecast = async (orders: Order[]): Promise<ForecastData | null> => {
    const historicalData = orders
        .filter(o => o.status === OrderStatus.Completed)
        .flatMap(order => 
            order.items.map(item => ({
                variety: item.variety,
                quantity: item.quantity,
                date: order.createdAt.toISOString().split('T')[0]
            }))
        );

    if (historicalData.length < 5) {
        // Not enough data for a meaningful forecast
        return null;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        You are a demand forecasting expert for a microgreens business.
        Based on the following historical sales data (in 50g boxes), predict the demand for each microgreen variety for the next 4 weeks.
        Analyze trends, seasonality, and individual variety performance.

        Historical Data:
        ${JSON.stringify(historicalData)}

        Provide the forecast in a structured JSON format. The JSON must be an array of 4 objects.
        Each object must represent a week and have two keys: "week" (e.g., "Week 1", "Week 2", etc.) and "predictions".
        The "predictions" key must be an array of objects, where each object has two keys: "variety" (the microgreen name as a string) and "quantity" (the predicted demand as an integer).
        Only include varieties with a predicted demand greater than 0. Do not include varieties with 0 predicted demand.
        The final output must be only the JSON array, with no other text or markdown formatting.
    `;

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                week: { type: Type.STRING },
                predictions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            variety: { type: Type.STRING },
                            quantity: { type: Type.INTEGER }
                        },
                        required: ['variety', 'quantity']
                    }
                }
            },
            required: ['week', 'predictions']
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Using a more powerful model for better analysis
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.2, // Lower temperature for more predictable, grounded forecasts
            },
        });

        const text = response.text.trim();
        if (text) {
            return JSON.parse(text) as ForecastData;
        }
        return null;
    } catch (error) {
        console.error("Error generating demand forecast:", error);
        throw new Error("Failed to communicate with the forecasting service.");
    }
};