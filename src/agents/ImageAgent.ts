import OpenAI from "openai"
import { getEnvironmentData } from "../utils/environment.js"

export async function generateImage(descricaoAmbiente: string) {

    const vars = getEnvironmentData();

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ""
    const openai = new OpenAI({
        apiKey: vars.OPENAI_API_KEY,
    })

    const prompt = `
    Create a photorealistic interior design image of: **${descricaoAmbiente}**. 

        <FOCUS_PRIORITY>
        PRIMARY FOCUS: The wall surface and paint finish quality must be the dominant visual element
        </FOCUS_PRIORITY>

        <WALL_SPECIFICATIONS>
        - Show pristine wall surface with premium paint finish
        - Highlight paint texture: smooth, flawless, professional application
        - Emphasize paint sheen: subtle satin or semi-gloss finish that catches light beautifully  
        - Display perfect color saturation and depth
        - Show no imperfections: no brush marks, roller marks, or uneven coverage
        - Demonstrate professional-grade paint quality with rich, vibrant color
        </WALL_SPECIFICATIONS>

        <LIGHTING_REQUIREMENTS>
        - Use soft, diffused natural lighting to showcase paint quality
        - Create subtle light gradients across the wall surface
        - Avoid harsh shadows that might hide paint details
        - Include warm, inviting ambient lighting
        - Show how light interacts with the paint finish
        </LIGHTING_REQUIREMENTS>

        <COMPOSITION_GUIDELINES>
        - Center the wall as the main subject (60-70% of frame)
        - Use shallow depth of field to keep wall surface sharp
        - Position camera at slight angle to show paint dimensionality
        - Include minimal furniture/decor that complements but doesn't distract
        - Maintain clean, uncluttered composition
        - DO NOT include any people or animals in the image
        - DO NOT include any elements that distract from the wall and paint
        </COMPOSITION_GUIDELINES>

        <TECHNICAL_SPECIFICATIONS>
        - Ultra-high resolution, professional photography quality
        - Sharp focus on wall texture and paint finish
        - Realistic color accuracy and saturation
        - Professional interior photography style
        - Clean, modern aesthetic
        - Emphasis on wall and paint details
        - DO NOT include any branding or logos on the image
        </TECHNICAL_SPECIFICATIONS>

        <STYLE_MODIFIERS>
        - Architectural photography style
        - Magazine-quality interior design shot  
        - Premium residential space aesthetic
        - Contemporary, sophisticated design
        </STYLE_MODIFIERS>
                `

    try {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            size: "1024x1024",
            quality: "standard",
            n: 1,
        })

        if (response.data && response.data.length > 0 && response.data[0] && response.data[0].url) {
            return {
                success: true,
                content: [{ data: response.data[0].url, description: descricaoAmbiente }],
            }
        }

        return {
            success: false,
            error: "Não foi possível gerar a imagem",
        }
    } catch (error) {
        return {
            success: false,
            error: `Erro ao gerar imagem: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        }
    }
}
