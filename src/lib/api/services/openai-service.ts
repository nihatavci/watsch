/**
 * OpenAI Service - Comprehensive service for OpenAI API
 */

import { ApiClient } from '../core/api-client.js';
import { getServiceConfig } from '../core/config.js';
import { dev } from '$app/environment';
import type {
  OpenAIChatCompletionRequest,
  OpenAIChatCompletionResponse,
  OpenAIMessage,
  ServiceResponse,
  OpenAIServiceRequest,
  OpenAIAnalysisResponse,
  OpenAIRecommendationResponse
} from '../core/types.js';

export interface MovieAnalysisRequest {
  title: string;
  overview: string;
  genres?: string[];
  releaseDate?: string;
  voteAverage?: number;
  cast?: string[];
  director?: string;
}

export interface MovieAnalysisResponse {
  themes: string[];
  similarMovies: string[];
  uniqueAspects: string[];
  recommendation: string;
  targetAudience: string;
  moodTags: string[];
}

export interface RecommendationPromptRequest {
  mediaType: 'movie' | 'tv';
  genres: string[];
  platforms: string[];
  preferences?: {
    minRating?: number;
    yearRange?: { start: number; end: number };
    language?: string;
    mood?: string;
  };
  userContext?: string;
}

export class OpenAIService {
  private client: ApiClient;
  private config: any;

  constructor() {
    this.config = getServiceConfig('openai');
    this.client = new ApiClient(this.config.baseUrl);
  }

  private hasValidApiKey(): boolean {
    return !!(this.config?.apiKey && this.config.apiKey.length > 10);
  }

  private getDefaultHeaders() {
    if (!this.hasValidApiKey()) {
      return {};
    }
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Generate chat completion
   */
  async chatCompletion(
    request: OpenAIChatCompletionRequest
  ): Promise<ServiceResponse<OpenAIChatCompletionResponse>> {
    if (this.shouldReturnMockData()) {
      return this.getMockChatCompletion(request);
    }

    const response = await this.client.post<OpenAIChatCompletionResponse>(
      '/chat/completions',
      request,
      this.getDefaultHeaders()
    );

    return {
      ...response,
      service: 'openai'
    };
  }

  /**
   * Generate text with simple prompt
   */
  async generateText(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<ServiceResponse<string>> {
    const messages: OpenAIMessage[] = [];
    
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    const request: OpenAIChatCompletionRequest = {
      model: options.model || this.config.model,
      messages,
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7
    };

    const response = await this.chatCompletion(request);
    
    const content = response.data.choices[0]?.message?.content || '';
    
    return {
      data: content,
      success: response.success,
      status: response.status,
      timestamp: response.timestamp,
      service: 'openai'
    };
  }

  /**
   * Analyze a movie and provide insights
   */
  async analyzeMovie(
    movieInfo: MovieAnalysisRequest
  ): Promise<ServiceResponse<MovieAnalysisResponse>> {
    const systemPrompt = `You are a movie analysis expert. Analyze movies and provide structured insights about themes, similar movies, unique aspects, and recommendations. Always respond in JSON format.`;

    const userPrompt = `
Analyze the following movie and provide insights:

Title: ${movieInfo.title}
Overview: ${movieInfo.overview}
${movieInfo.genres ? `Genres: ${movieInfo.genres.join(', ')}` : ''}
${movieInfo.releaseDate ? `Release Date: ${movieInfo.releaseDate}` : ''}
${movieInfo.voteAverage ? `Rating: ${movieInfo.voteAverage}/10` : ''}
${movieInfo.cast ? `Cast: ${movieInfo.cast.join(', ')}` : ''}
${movieInfo.director ? `Director: ${movieInfo.director}` : ''}

Please provide a JSON response with the following structure:
{
  "themes": ["theme1", "theme2", "theme3"],
  "similarMovies": ["movie1", "movie2", "movie3"],
  "uniqueAspects": ["aspect1", "aspect2", "aspect3"],
  "recommendation": "A brief recommendation paragraph",
  "targetAudience": "Description of target audience",
  "moodTags": ["mood1", "mood2", "mood3"]
}
    `;

    if (this.shouldReturnMockData()) {
      return this.getMockMovieAnalysis(movieInfo);
    }

    const textResponse = await this.generateText(userPrompt, {
      systemPrompt,
      temperature: 0.8,
      maxTokens: 1500
    });

    try {
      const analysisData = JSON.parse(textResponse.data) as MovieAnalysisResponse;
      
      return {
        data: analysisData,
        success: textResponse.success,
        status: textResponse.status,
        timestamp: textResponse.timestamp,
        service: 'openai'
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        data: {
          themes: ['Drama', 'Character Development'],
          similarMovies: ['Similar Movie 1', 'Similar Movie 2'],
          uniqueAspects: ['Unique storytelling', 'Strong performances'],
          recommendation: textResponse.data,
          targetAudience: 'General audience',
          moodTags: ['Engaging', 'Thoughtful']
        },
        success: textResponse.success,
        status: textResponse.status,
        timestamp: textResponse.timestamp,
        service: 'openai'
      };
    }
  }

  /**
   * Generate personalized recommendation prompt
   */
  async generateRecommendationPrompt(
    request: RecommendationPromptRequest
  ): Promise<ServiceResponse<string>> {
    const systemPrompt = `You are a personalized entertainment recommendation expert. Create detailed, engaging prompts for finding the perfect ${request.mediaType} based on user preferences.`;

    const userPrompt = `
Create a personalized recommendation prompt for finding ${request.mediaType}s with these criteria:

Media Type: ${request.mediaType}
Genres: ${request.genres.join(', ')}
Platforms: ${request.platforms.join(', ')}
${request.preferences?.minRating ? `Minimum Rating: ${request.preferences.minRating}/10` : ''}
${request.preferences?.yearRange ? `Year Range: ${request.preferences.yearRange.start}-${request.preferences.yearRange.end}` : ''}
${request.preferences?.language ? `Language: ${request.preferences.language}` : ''}
${request.preferences?.mood ? `Mood: ${request.preferences.mood}` : ''}
${request.userContext ? `User Context: ${request.userContext}` : ''}

Generate a compelling, personalized prompt that will help find the perfect ${request.mediaType} recommendation. Make it engaging and specific to these preferences.
    `;

    return this.generateText(userPrompt, {
      systemPrompt,
      temperature: 0.9,
      maxTokens: 800
    });
  }

  /**
   * Generate content summary
   */
  async summarizeContent(
    content: string,
    options: {
      maxLength?: number;
      style?: 'brief' | 'detailed' | 'bullet-points';
      focus?: string;
    } = {}
  ): Promise<ServiceResponse<string>> {
    const systemPrompt = `You are an expert content summarizer. Create clear, concise summaries that capture the key points while maintaining readability.`;

    const styleInstructions = {
      'brief': 'Create a brief, one-paragraph summary.',
      'detailed': 'Create a detailed summary with multiple paragraphs.',
      'bullet-points': 'Create a summary using bullet points for key information.'
    };

    const userPrompt = `
Summarize the following content:

${content}

Instructions:
- ${styleInstructions[options.style || 'brief']}
${options.maxLength ? `- Keep it under ${options.maxLength} words` : ''}
${options.focus ? `- Focus particularly on: ${options.focus}` : ''}
- Make it engaging and informative
    `;

    return this.generateText(userPrompt, {
      systemPrompt,
      temperature: 0.5,
      maxTokens: options.maxLength ? Math.min(options.maxLength * 2, 1000) : 500
    });
  }

  /**
   * Generate creative content
   */
  async generateCreativeContent(
    prompt: string,
    type: 'story' | 'review' | 'description' | 'dialogue',
    options: {
      tone?: 'casual' | 'formal' | 'humorous' | 'dramatic';
      length?: 'short' | 'medium' | 'long';
      style?: string;
    } = {}
  ): Promise<ServiceResponse<string>> {
    const systemPrompts = {
      'story': 'You are a creative storyteller who crafts engaging narratives.',
      'review': 'You are a professional reviewer who writes insightful, balanced reviews.',
      'description': 'You are a skilled writer who creates vivid, compelling descriptions.',
      'dialogue': 'You are a dialogue writer who creates natural, engaging conversations.'
    };

    const lengthInstructions = {
      'short': 'Keep it concise, around 100-200 words.',
      'medium': 'Write a medium-length piece, around 300-500 words.',
      'long': 'Create a detailed, comprehensive piece, around 600-1000 words.'
    };

    const toneInstructions = {
      'casual': 'Use a casual, conversational tone.',
      'formal': 'Use a formal, professional tone.',
      'humorous': 'Use humor and wit throughout.',
      'dramatic': 'Use dramatic, emotional language.'
    };

    const systemPrompt = systemPrompts[type];
    
    const userPrompt = `
${prompt}

Instructions:
- ${lengthInstructions[options.length || 'medium']}
- ${toneInstructions[options.tone || 'casual']}
${options.style ? `- Style: ${options.style}` : ''}
- Make it engaging and well-written
    `;

    return this.generateText(userPrompt, {
      systemPrompt,
      temperature: 0.8,
      maxTokens: options.length === 'long' ? 1500 : options.length === 'short' ? 400 : 800
    });
  }

  /**
   * Analyze content and provide insights
   */
  async analyzeContent(content: string, context?: string): Promise<OpenAIAnalysisResponse> {
    if (!this.hasValidApiKey()) {
      return this.getMockAnalysisResponse(content);
    }

    try {
      const response = await this.client.post<OpenAIAnalysisResponse>('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes movie and TV content.'
          },
          {
            role: 'user',
            content: `Analyze this content: ${content}${context ? ` Context: ${context}` : ''}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      }, this.getDefaultHeaders());
      
      return response;
    } catch (error) {
      console.warn('OpenAI analysis failed, returning mock data:', error);
      return this.getMockAnalysisResponse(content);
    }
  }

  /**
   * Generate recommendations based on user preferences
   */
  async generateRecommendations(preferences: string, count = 5): Promise<OpenAIRecommendationResponse> {
    // Security: Limit count to prevent excessive API usage
    const validatedCount = Math.min(Math.max(parseInt(count as any) || 5, 1), 5);
    
    if (!this.hasValidApiKey()) {
      return this.getMockRecommendationResponse(preferences);
    }

    try {
      const response = await this.client.post<OpenAIRecommendationResponse>('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a movie and TV show recommendation expert. Provide personalized recommendations based on user preferences.'
          },
          {
            role: 'user',
            content: `Based on these preferences: ${preferences}, recommend ${validatedCount} movies or TV shows. Include title, brief description, and why it matches the preferences.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.8
      }, this.getDefaultHeaders());
      
      return response;
    } catch (error) {
      console.warn('OpenAI recommendations failed, returning mock data:', error);
      return this.getMockRecommendationResponse(preferences);
    }
  }

  /**
   * Check if we should return mock data (development mode with placeholder key)
   */
  private shouldReturnMockData(): boolean {
    return dev && !this.hasValidApiKey();
  }

  // Mock data methods for development
  private getMockChatCompletion(
    request: OpenAIChatCompletionRequest
  ): ServiceResponse<OpenAIChatCompletionResponse> {
    const userMessage = request.messages.find(m => m.role === 'user')?.content || '';
    
    return {
      data: {
        id: 'mock-completion-id',
        object: 'chat.completion',
        created: Date.now(),
        model: request.model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: `This is a mock response to: "${userMessage.substring(0, 50)}...". In production, this would be a real OpenAI response.`
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 30,
          total_tokens: 80
        }
      },
      success: true,
      status: 200,
      timestamp: new Date().toISOString(),
      service: 'openai'
    };
  }

  private getMockMovieAnalysis(
    movieInfo: MovieAnalysisRequest
  ): ServiceResponse<MovieAnalysisResponse> {
    return {
      data: {
        themes: [
          'Character Development',
          'Human Relationships',
          'Overcoming Challenges'
        ],
        similarMovies: [
          'Similar Movie A',
          'Similar Movie B',
          'Similar Movie C'
        ],
        uniqueAspects: [
          'Compelling storytelling',
          'Strong character arcs',
          'Excellent cinematography'
        ],
        recommendation: `${movieInfo.title} is a compelling ${movieInfo.genres?.join('/')} film that offers engaging storytelling and memorable characters. Perfect for viewers who enjoy thoughtful narratives with emotional depth.`,
        targetAudience: 'Adults and mature teens who appreciate character-driven stories',
        moodTags: [
          'Engaging',
          'Thoughtful',
          'Emotionally Resonant'
        ]
      },
      success: true,
      status: 200,
      timestamp: new Date().toISOString(),
      service: 'openai'
    };
  }

  private getMockAnalysisResponse(content: string): OpenAIAnalysisResponse {
    return {
      id: 'mock-analysis-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gpt-3.5-turbo',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: `This is a mock analysis of the content: "${content.substring(0, 50)}...". The content appears to be engaging and well-structured, with strong narrative elements that would appeal to a broad audience.`
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 50,
        completion_tokens: 100,
        total_tokens: 150
      }
    };
  }

  private getMockRecommendationResponse(preferences: string): OpenAIRecommendationResponse {
    return {
      id: 'mock-recommendation-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gpt-3.5-turbo',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: `Based on your preferences for "${preferences}", here are some recommendations:

1. **The Shawshank Redemption** - A timeless drama about hope and friendship that resonates with viewers who appreciate character-driven stories.

2. **Breaking Bad** - An intense crime drama series perfect for those who enjoy complex character development and moral ambiguity.

3. **Inception** - A mind-bending sci-fi thriller that appeals to viewers who enjoy intricate plots and stunning visuals.

4. **The Office** - A beloved comedy series that's perfect for those seeking humor and relatable workplace scenarios.

5. **Interstellar** - A space epic that combines emotional storytelling with scientific concepts, ideal for sci-fi enthusiasts.`
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 200,
        total_tokens: 300
      }
    };
  }
}

// Export singleton instance
export const openaiService = new OpenAIService(); 