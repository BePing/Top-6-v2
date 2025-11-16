import OpenAI from "openai";
import { LoggingService } from "../../common";
import { PlayerPosition } from "../../processing/top/4-consolidate-tops/consolidate-top-model";

export interface RegionAnalytics {
  region: string;
  weekName: number;
  totalPlayers: number;
  playersByLevel: { [level: string]: number };
  topPlayersByLevel: { [level: string]: PlayerPosition[] };
  clubs: string[];
  previousWeekComparison?: {
    newTopPlayers: PlayerPosition[];
    playersWhoDropped: PlayerPosition[];
    biggestPointGains: Array<{ player: PlayerPosition; pointGain: number }>;
    clubPerformanceChanges: Array<{ club: string; change: 'up' | 'down' | 'stable'; playersInTop: number }>;
  };
}

export interface AISummary {
  region: string;
  weekName: number;
  summary: string;
  keyHighlights: string[];
  topPerformers: Array<{
    name: string;
    club: string;
    level: string;
    achievement: string;
  }>;
  trends: {
    risingPlayers: string[];
    dominantClubs: string[];
    competitiveLevel: string;
    weeklyInsight: string;
  };
  generatedAt: Date;
}

interface RawAIResponse {
  summary?: string;
  keyHighlights?: string[];
  topPerformers?: Array<{
    name?: string;
    club?: string;
    level?: string;
    achievement?: string;
  }>;
  trends?: {
    risingPlayers?: string[];
    dominantClubs?: string[];
    competitiveLevel?: string;
    weeklyInsight?: string;
  };
}

interface APIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface AIServiceConfig {
  model: string;
  temperature: number;
  maxCompletionTokens: number;
  requestTimeout: number;
  retryAttempts: number;
  rateLimitDelay: number;
}

export class AiSummaryService {
  private openai: OpenAI | null = null;
  private tokenUsage: APIUsage[] = [];
  private readonly config: AIServiceConfig;

  constructor(
    private readonly loggingService: LoggingService,
  ) {
    this.config = {
      model: process.env.AI_MODEL || "gpt-4o-mini",
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      maxCompletionTokens: parseInt(process.env.AI_MAX_TOKENS || '2500', 10),
      // Increased default timeout to 90 seconds for large completions (2500 tokens can take time)
      requestTimeout: parseInt(process.env.AI_REQUEST_TIMEOUT || '90000', 10),
      retryAttempts: parseInt(process.env.AI_RETRY_ATTEMPTS || '3', 10),
      rateLimitDelay: parseInt(process.env.AI_RATE_LIMIT_DELAY || '1000', 10),
    };
    this.initializeOpenAI();
  }

  private initializeOpenAI(): void {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.loggingService.warn('⚠️  Clé API OpenAI non trouvée dans les variables d\'environnement. Les résumés IA seront désactivés.');
      this.loggingService.info('💡 Pour activer les résumés IA, définissez OPENAI_API_KEY dans votre fichier .env ou environnement');
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
        timeout: this.config.requestTimeout,
        maxRetries: 0, // We handle retries ourselves with exponential backoff
      });
      this.loggingService.info(`✅ Client OpenAI initialisé avec succès (timeout: ${this.config.requestTimeout}ms)`);
    } catch (error) {
      this.loggingService.error('❌ Échec de l\'initialisation du client OpenAI :', error);
      this.loggingService.error('💡 Veuillez vérifier votre OPENAI_API_KEY dans le fichier .env');
    }
  }

  private validateAnalytics(analytics: RegionAnalytics): void {
    if (!analytics.region || typeof analytics.region !== 'string') {
      throw new Error('Invalid analytics: region is required and must be a string');
    }
    if (!analytics.weekName || typeof analytics.weekName !== 'number' || analytics.weekName < 1) {
      throw new Error('Invalid analytics: weekName must be a positive number');
    }
    if (typeof analytics.totalPlayers !== 'number' || analytics.totalPlayers < 0) {
      throw new Error('Invalid analytics: totalPlayers must be a non-negative number');
    }
    if (!Array.isArray(analytics.clubs)) {
      throw new Error('Invalid analytics: clubs must be an array');
    }
    if (!analytics.playersByLevel || typeof analytics.playersByLevel !== 'object') {
      throw new Error('Invalid analytics: playersByLevel must be an object');
    }
    if (!analytics.topPlayersByLevel || typeof analytics.topPlayersByLevel !== 'object') {
      throw new Error('Invalid analytics: topPlayersByLevel must be an object');
    }
  }

  private sanitizeForPrompt(text: string): string {
    // Remove or escape special characters that could break prompts
    return text
      .replace(/[{}]/g, '') // Remove JSON-like characters
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
      .trim();
  }

  private validateAIResponse(response: RawAIResponse): Omit<AISummary, 'region' | 'weekName' | 'generatedAt'> {
    if (!response.summary || typeof response.summary !== 'string') {
      throw new Error('Invalid AI response: missing or invalid summary field');
    }

    return {
      summary: response.summary,
      keyHighlights: Array.isArray(response.keyHighlights) 
        ? response.keyHighlights.filter((h): h is string => typeof h === 'string')
        : [],
      topPerformers: Array.isArray(response.topPerformers)
        ? response.topPerformers
            .filter((p): p is NonNullable<typeof p> => p !== null && typeof p === 'object')
            .map(p => ({
              name: typeof p.name === 'string' ? p.name : 'Unknown',
              club: typeof p.club === 'string' ? p.club : 'Unknown',
              level: typeof p.level === 'string' ? p.level : 'Unknown',
              achievement: typeof p.achievement === 'string' ? p.achievement : ''
            }))
        : [],
      trends: {
        risingPlayers: Array.isArray(response.trends?.risingPlayers)
          ? response.trends.risingPlayers.filter((p): p is string => typeof p === 'string')
          : [],
        dominantClubs: Array.isArray(response.trends?.dominantClubs)
          ? response.trends.dominantClubs.filter((c): c is string => typeof c === 'string')
          : [],
        competitiveLevel: typeof response.trends?.competitiveLevel === 'string'
          ? response.trends.competitiveLevel
          : 'Modéré',
        weeklyInsight: typeof response.trends?.weeklyInsight === 'string'
          ? response.trends.weeklyInsight
          : 'La compétition reste active'
      }
    };
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    context: string,
    maxRetries?: number
  ): Promise<T> {
    const retries = maxRetries ?? this.config.retryAttempts;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if error is retryable (rate limit or server error)
        const isRetryable = error?.status === 429 || (error?.status >= 500 && error?.status < 600);
        
        if (!isRetryable || attempt === retries - 1) {
          throw lastError;
        }

        const delay = this.config.rateLimitDelay * Math.pow(2, attempt);
        this.loggingService.warn(`${context} - Tentative ${attempt + 1}/${retries} échouée. Nouvelle tentative dans ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  private async makeAPIRequestWithTimeout<T>(
    requestFn: () => Promise<T>,
    timeout: number = this.config.requestTimeout
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
    });

    try {
      const result = await Promise.race([
        requestFn(),
        timeoutPromise
      ]);
      // Clear timeout if request completed successfully
      clearTimeout(timeoutId!);
      return result;
    } catch (error) {
      // Clear timeout on error as well
      clearTimeout(timeoutId!);
      throw error;
    }
  }

  private trackTokenUsage(response: any): void {
    if (response?.usage) {
      const usage: APIUsage = {
        promptTokens: response.usage.prompt_tokens || 0,
        completionTokens: response.usage.completion_tokens || 0,
        totalTokens: response.usage.total_tokens || 0,
      };
      this.tokenUsage.push(usage);
      this.loggingService.trace(
        `Token usage: ${usage.totalTokens} (prompt: ${usage.promptTokens}, completion: ${usage.completionTokens})`
      );
    }
  }

  getTokenUsage(): APIUsage[] {
    return [...this.tokenUsage];
  }

  getTotalTokenUsage(): APIUsage {
    return this.tokenUsage.reduce(
      (acc, usage) => ({
        promptTokens: acc.promptTokens + usage.promptTokens,
        completionTokens: acc.completionTokens + usage.completionTokens,
        totalTokens: acc.totalTokens + usage.totalTokens,
      }),
      { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    );
  }

  async generateRegionSummary(analytics: RegionAnalytics): Promise<AISummary | null> {
    if (!this.openai) {
      this.loggingService.warn(`Saut du résumé IA pour ${analytics.region} - OpenAI non initialisé`);
      return null;
    }

    try {
      // Validate input
      this.validateAnalytics(analytics);

      this.loggingService.info(`Génération du résumé IA pour la région ${analytics.region}, semaine ${analytics.weekName}`);
      const startTime = Date.now();

      const prompt = this.buildAnalysisPrompt(analytics);
      this.loggingService.trace(`Prompt length: ${prompt.length} characters`);
      
      const response = await this.retryWithBackoff(
        () => this.makeAPIRequestWithTimeout(() =>
          this.openai!.chat.completions.create({
            model: this.config.model,
            temperature: this.config.temperature,
            messages: [
              {
                role: "system",
                content: this.getSystemPrompt()
              },
              {
                role: "user", 
                content: prompt
              }
            ],
            max_completion_tokens: this.config.maxCompletionTokens,
            response_format: { type: "json_object" }
          })
        ),
        `Résumé IA pour ${analytics.region}`
      );

      // Track token usage
      this.trackTokenUsage(response);
      const duration = Date.now() - startTime;
      this.loggingService.trace(`API request completed in ${duration}ms`);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Aucun contenu reçu d\'OpenAI');
      }

      let aiAnalysis: RawAIResponse;
      try {
        aiAnalysis = JSON.parse(content);
      } catch (parseError) {
        throw new Error(`Invalid JSON response from AI: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      const validatedSummary = this.validateAIResponse(aiAnalysis);
      
      const summary: AISummary = {
        ...validatedSummary,
        region: analytics.region,
        weekName: analytics.weekName,
        generatedAt: new Date()
      };

      this.loggingService.trace(`✅ Résumé IA généré pour ${analytics.region}`);
      return summary;

    } catch (error) {
      this.loggingService.error(`Échec de génération du résumé IA pour ${analytics.region} :`, error);
      if (error instanceof Error) {
        this.loggingService.error(`Message d'erreur : ${error.message}`);
        if (process.env.NODE_ENV === 'development') {
          this.loggingService.error(`Stack trace : ${error.stack}`);
        }
      }
      return null;
    }
  }

  private getSystemPrompt(): string {
    return `Tu es un analyste sportif expert spécialisé dans les championnats de tennis de table. Tu analyses les données de classement régional pour fournir des résumés perspicaces aux fans et participants.

Ta tâche est d'analyser les données de classement du championnat et de fournir des résumés engageants qui mettent en évidence :
- Les performances et réalisations clés
- La dynamique compétitive entre joueurs et clubs
- Les tendances notables et changements par rapport aux semaines précédentes
- Les insights spécifiques par niveau (niveaux Provinciaux P1-P6, National WB)

Réponds UNIQUEMENT avec du JSON valide dans ce format exact :
{
  "summary": "Aperçu en 2-3 phrases des développements clés de la semaine",
  "keyHighlights": ["point fort 1", "point fort 2", "point fort 3"],
  "topPerformers": [
    {
      "name": "Nom du Joueur",
      "club": "Nom du Club", 
      "level": "Niveau",
      "achievement": "Ce qu'il a accompli"
    }
  ],
  "trends": {
    "risingPlayers": ["noms des joueurs qui montent dans les classements"],
    "dominantClubs": ["clubs avec de bonnes performances"],
    "competitiveLevel": "Élevé/Modéré/Faible",
    "weeklyInsight": "Une observation clé sur la compétition de cette semaine"
  }
}

Utilise un langage engageant mais professionnel. Concentre-toi sur les aspects compétitifs et les histoires humaines intéressantes.`;
  }

  private buildAnalysisPrompt(analytics: RegionAnalytics): string {
    const { region, weekName, totalPlayers, playersByLevel, topPlayersByLevel, clubs } = analytics;
    
    // Sanitize inputs
    const sanitizedRegion = this.sanitizeForPrompt(region);
    
    let prompt = `Analyse les données du championnat de tennis de table pour la région ${sanitizedRegion}, semaine ${weekName} :

APERÇU DE LA RÉGION :
- Total de joueurs actifs : ${totalPlayers}
- Nombre de clubs : ${clubs.length}
- Clubs participants : ${clubs.map(c => this.sanitizeForPrompt(c)).join(', ')}

RÉPARTITION DES JOUEURS PAR NIVEAU :`;

    Object.entries(playersByLevel).forEach(([level, count]) => {
      if (count > 0) {
        prompt += `\n- ${level}: ${count} joueurs`;
      }
    });

    prompt += `\n\nMEILLEURS JOUEURS PAR NIVEAU :`;
    
    Object.entries(topPlayersByLevel).forEach(([level, players]) => {
      if (players.length > 0) {
        prompt += `\n\n${level} (Meilleurs performeurs) :`;
        players.slice(0, 5).forEach((player, idx) => {
          prompt += `\n${idx + 1}. ${player.name} (${player.clubName}) - ${player.points.total} pts`;
          prompt += ` [5pts: ${player.points.count5Pts}, 3pts: ${player.points.count3Pts}, 2pts: ${player.points.count2Pts}, 1pt: ${player.points.count1Pts}]`;
        });
      }
    });

    if (analytics.previousWeekComparison) {
      const comp = analytics.previousWeekComparison;
      
      if (comp.newTopPlayers.length > 0) {
        prompt += `\n\nNOUVEAUX JOUEURS DE POINTE (entrés dans les classements de pointe cette semaine) :`;
        comp.newTopPlayers.forEach(player => {
          prompt += `\n- ${player.name} (${player.clubName}) avec ${player.points.total} pts`;
        });
      }

      if (comp.biggestPointGains.length > 0) {
        prompt += `\n\nPLUS GROS GAINS DE POINTS :`;
        comp.biggestPointGains.slice(0, 3).forEach(gain => {
          prompt += `\n- ${gain.player.name} (${gain.player.clubName}) : +${gain.pointGain} points`;
        });
      }

      if (comp.clubPerformanceChanges.length > 0) {
        prompt += `\n\nTENDANCES DE PERFORMANCE DES CLUBS :`;
        comp.clubPerformanceChanges.forEach(change => {
          const changeText = change.change === 'up' ? 'en hausse' : change.change === 'down' ? 'en baisse' : 'stable';
          prompt += `\n- ${change.club}: ${changeText} (${change.playersInTop} joueurs dans les classements de pointe)`;
        });
      }
    }

    prompt += `\n\nFournis une analyse engageante centrée sur la dynamique compétitive, les performances remarquables et les tendances intéressantes. Considère la distribution des points (5pts pour les victoires majeures, décroissant jusqu'à 1pt) lors de la mise en évidence des réalisations.`;

    return prompt;
  }

  async generateBatchSummaries(analyticsArray: RegionAnalytics[]): Promise<(AISummary | null)[]> {
    if (!this.openai) {
      this.loggingService.warn('Saut des résumés IA par lots - OpenAI non initialisé');
      return analyticsArray.map(() => null);
    }

    this.loggingService.info(`Génération des résumés IA pour ${analyticsArray.length} régions...`);
    
    const summaries: (AISummary | null)[] = [];
    
    // Traiter les régions séquentiellement pour éviter les limites de taux
    for (const analytics of analyticsArray) {
      const summary = await this.generateRegionSummary(analytics);
      summaries.push(summary);
      
      // Délai configurable pour respecter les limites de taux
      if (summaries.length < analyticsArray.length) {
        await new Promise(resolve => setTimeout(resolve, this.config.rateLimitDelay));
      }
    }

    const successCount = summaries.filter(s => s !== null).length;
    const totalUsage = this.getTotalTokenUsage();
    this.loggingService.info(`✅ Généré ${successCount}/${analyticsArray.length} résumés IA (Total tokens: ${totalUsage.totalTokens})`);
    
    return summaries;
  }

  async generateFacebookPost(analytics: RegionAnalytics): Promise<string | null> {
    if (!this.openai) {
      this.loggingService.warn(`Saut de la génération de post Facebook pour ${analytics.region} - OpenAI non initialisé`);
      return null;
    }

    try {
      // Validate input
      this.validateAnalytics(analytics);

      this.loggingService.info(`Génération du post Facebook pour la région ${analytics.region}, semaine ${analytics.weekName}`);
      const startTime = Date.now();

      const prompt = this.buildFacebookPostPrompt(analytics);
      this.loggingService.trace(`Prompt length: ${prompt.length} characters`);
      
      const response = await this.retryWithBackoff(
        () => this.makeAPIRequestWithTimeout(() =>
          this.openai!.chat.completions.create({
            model: this.config.model,
            temperature: this.config.temperature,
            messages: [
              {
                role: "system",
                content: this.getFacebookPostSystemPrompt()
              },
              {
                role: "user", 
                content: prompt
              }
            ],
            max_completion_tokens: this.config.maxCompletionTokens,
            response_format: { type: "text" }
          })
        ),
        `Post Facebook pour ${analytics.region}`
      );

      // Track token usage
      this.trackTokenUsage(response);
      const duration = Date.now() - startTime;
      this.loggingService.trace(`API request completed in ${duration}ms`);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Aucun contenu reçu d\'OpenAI pour le post Facebook');
      }

      this.loggingService.trace(`✅ Post Facebook généré pour ${analytics.region}`);
      return content;

    } catch (error) {
      this.loggingService.error(`Échec de génération du post Facebook pour ${analytics.region} :`, error);
      if (error instanceof Error) {
        this.loggingService.error(`Message d'erreur : ${error.message}`);
        if (process.env.NODE_ENV === 'development') {
          this.loggingService.error(`Stack trace : ${error.stack}`);
        }
      }
      return null;
    }
  }

  async generateBatchFacebookPosts(analyticsArray: RegionAnalytics[]): Promise<(string | null)[]> {
    if (!this.openai) {
      this.loggingService.warn('Saut des posts Facebook par lots - OpenAI non initialisé');
      return analyticsArray.map(() => null);
    }

    this.loggingService.info(`Génération des posts Facebook pour ${analyticsArray.length} régions...`);
    
    const posts: (string | null)[] = [];
    
    // Traiter les régions séquentiellement pour éviter les limites de taux
    for (const analytics of analyticsArray) {
      const post = await this.generateFacebookPost(analytics);
      posts.push(post);
      
      // Délai configurable pour respecter les limites de taux
      if (posts.length < analyticsArray.length) {
        await new Promise(resolve => setTimeout(resolve, this.config.rateLimitDelay));
      }
    }

    const successCount = posts.filter(p => p !== null).length;
    const totalUsage = this.getTotalTokenUsage();
    this.loggingService.info(`✅ Généré ${successCount}/${analyticsArray.length} posts Facebook (Total tokens: ${totalUsage.totalTokens})`);
    
    return posts;
  }

  private getFacebookPostSystemPrompt(): string {
    return `Tu es un expert en marketing digital et en tennis de table, spécialisé dans la création de posts Facebook engageants pour des championnats régionaux.

Ta mission est de créer des posts Facebook captivants qui :
- Raconte une histoire compétitive passionnante
- Mettent en valeur les performances des joueurs et clubs
- Créent de l'engagement et de l'interaction
- Utilisent un ton amical et inclusif
- Intègrent des emojis appropriés pour le tennis de table et le sport

OBLIGATOIRE - Structure du post :
1. ANALYSE DE LA SEMAINE (2-3 phrases) : Aperçu général des développements et tendances
2. CLASSEMENT PAR DIVISION (appelé niveau dans le code) : Inclus systématiquement les TOP 6 joueurs de chaque niveau
3. Points forts et performances remarquables
4. Hashtags pertinents

CLASSEMENT PAR NIVEAU - OBLIGATOIRE À INCLURE :
- Inclus systématiquement les TOP 6 joueurs de chaque niveau
- Présente les résultats par catégorie (Provincial 1, Provincial 2, etc.). 
- NAT_WB = National WB
- Organise clairement l'information par niveau

COHÉRENCE DU CONTENU - OBLIGATOIRE :
- La case (le contenu) doit être cohérente et logique du début à la fin
- Les informations doivent s'enchaîner de manière fluide et naturelle
- Évite les contradictions entre les différentes sections
- Maintiens un ton et un style uniformes tout au long du post
- Assure que l'analyse de la semaine correspond aux classements présentés
- Les points forts mentionnés doivent être cohérents avec les données des classements

FORMAT DU POST :
- Commence par un titre accrocheur avec emoji
- Inclus des points clés avec des puces
- Inclus OBLIGATOIREMENT l'analyse de la semaine au début
- Inclus OBLIGATOIREMENT le classement complet par niveau (top 6)
- Utilise des paragraphes courts et lisibles
- Termine par des hashtags pertinents
- Longueur optimale : 400-600 mots

TON ET STYLE :
- Dynamique et enthousiaste
- Accessible à tous les niveaux de compétition
- Célébration des performances et de l'esprit sportif
- Encourage la participation et l'engagement

Évite le jargon technique complexe. Privilégie l'émotion et l'humain. Le classement par niveau (top 6) et l'analyse de la semaine sont les parties les plus importantes du post. La cohérence du contenu est essentielle pour maintenir la crédibilité et l'engagement.`;
  }

  private buildFacebookPostPrompt(analytics: RegionAnalytics): string {
    const { region, weekName, totalPlayers, playersByLevel, topPlayersByLevel, clubs } = analytics;
    
    // Sanitize inputs
    const sanitizedRegion = this.sanitizeForPrompt(region);
    
    let prompt = `Crée un post Facebook engageant pour le championnat de tennis de table de la région ${sanitizedRegion}, semaine ${weekName}.

CONTEXTE DE LA RÉGION :
- Total de joueurs actifs : ${totalPlayers}
- Nombre de clubs participants : ${clubs.length}
- Clubs : ${clubs.map(c => this.sanitizeForPrompt(c)).join(', ')}

RÉPARTITION DES JOUEURS PAR NIVEAU :`;

    Object.entries(playersByLevel).forEach(([level, count]) => {
      if (count > 0) {
        prompt += `\n- ${level}: ${count} joueurs`;
      }
    });

    prompt += `\n\nCLASSEMENT PAR NIVEAU - TOP 6 OBLIGATOIRE :`;
    
    Object.entries(topPlayersByLevel).forEach(([level, players]) => {
      if (players.length > 0) {
        prompt += `\n\n${level} (Top 6) :`;
        players.slice(0, 6).forEach((player, idx) => {
          prompt += `\n${idx + 1}. ${player.name} (${player.clubName}) - ${player.points.total} pts`;
          prompt += ` [5pts: ${player.points.count5Pts}, 3pts: ${player.points.count3Pts}, 2pts: ${player.points.count2Pts}, 1pt: ${player.points.count1Pts}]`;
        });
      }
    });

    if (analytics.previousWeekComparison) {
      const comp = analytics.previousWeekComparison;
      
      if (comp.newTopPlayers.length > 0) {
        prompt += `\n\nNOUVEAUX JOUEURS DE POINTE (entrés dans les classements de pointe cette semaine) :`;
        comp.newTopPlayers.forEach(player => {
          prompt += `\n- ${player.name} (${player.clubName}) avec ${player.points.total} pts`;
        });
      }

      if (comp.biggestPointGains.length > 0) {
        prompt += `\n\nPLUS GROS GAINS DE POINTS :`;
        comp.biggestPointGains.slice(0, 3).forEach(gain => {
          prompt += `\n- ${gain.player.name} (${gain.player.clubName}) : +${gain.pointGain} points`;
        });
      }

      if (comp.clubPerformanceChanges.length > 0) {
        prompt += `\n\nTENDANCES DE PERFORMANCE DES CLUBS :`;
        comp.clubPerformanceChanges.forEach(change => {
          const changeText = change.change === 'up' ? 'en hausse' : change.change === 'down' ? 'en baisse' : 'stable';
          prompt += `\n- ${change.club}: ${changeText} (${change.playersInTop} joueurs dans les classements de pointe)`;
        });
      }
    }

    prompt += `\n\nINSTRUCTIONS SPÉCIALES :
1. COMMENCE PAR UNE ANALYSE DE LA SEMAINE (2-3 phrases) : Donne un aperçu général des développements, tendances et dynamiques de la semaine
2. Le classement par niveau est OBLIGATOIRE et doit inclure les TOP 6 joueurs de chaque niveau
3. Présente chaque niveau avec un titre clair et les 6 premiers joueurs
4. Inclus les points totaux et les détails des points (5pts, 3pts, 2pts, 1pt) pour chaque joueur
5. Organise l'information de manière claire et lisible
6. Crée un post Facebook engageant qui célèbre la compétition et met en valeur les performances remarquables
7. Utilise un ton enthousiaste et inclusif
8. Termine par des hashtags pertinents

COHÉRENCE DU CONTENU - OBLIGATOIRE :
- Assure que l'analyse de la semaine correspond parfaitement aux classements présentés
- Les points forts mentionnés doivent être cohérents avec les données des classements
- Maintiens une logique fluide entre toutes les sections du post
- Évite toute contradiction entre l'analyse, les classements et les commentaires
- Le ton et le style doivent rester uniformes du début à la fin

STRUCTURE OBLIGATOIRE :
- Titre accrocheur
- ANALYSE DE LA SEMAINE (2-3 phrases d'introduction)
- CLASSEMENT COMPLET PAR NIVEAU (top 6 de chaque niveau)
- Points forts et performances
- Hashtags

L'analyse de la semaine, le classement complet par niveau (top 6) et la cohérence du contenu sont les éléments les plus importants du post.`;

    return prompt;
  }

  isEnabled(): boolean {
    return this.openai !== null;
  }
}