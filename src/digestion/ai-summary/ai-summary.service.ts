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

export class AiSummaryService {
  private openai: OpenAI | null = null;

  constructor(
    private readonly loggingService: LoggingService,
  ) {
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
      });
      this.loggingService.info('✅ Client OpenAI initialisé avec succès');
      this.loggingService.trace(`🔑 Utilisation de la clé API OpenAI : ${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`);
    } catch (error) {
      this.loggingService.error('❌ Échec de l\'initialisation du client OpenAI :', error);
      this.loggingService.error('💡 Veuillez vérifier votre OPENAI_API_KEY dans le fichier .env');
    }
  }

  async generateRegionSummary(analytics: RegionAnalytics): Promise<AISummary | null> {
    if (!this.openai) {
      this.loggingService.warn(`Saut du résumé IA pour ${analytics.region} - OpenAI non initialisé`);
      return null;
    }

    try {
      this.loggingService.info(`Génération du résumé IA pour la région ${analytics.region}, semaine ${analytics.weekName}`);

      const prompt = this.buildAnalysisPrompt(analytics);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
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
        max_completion_tokens: 2500,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Aucun contenu reçu d\'OpenAI');
      }

      const aiAnalysis = JSON.parse(content);
      
      const summary: AISummary = {
        region: analytics.region,
        weekName: analytics.weekName,
        summary: aiAnalysis.summary,
        keyHighlights: aiAnalysis.keyHighlights || [],
        topPerformers: aiAnalysis.topPerformers || [],
        trends: {
          risingPlayers: aiAnalysis.trends?.risingPlayers || [],
          dominantClubs: aiAnalysis.trends?.dominantClubs || [],
          competitiveLevel: aiAnalysis.trends?.competitiveLevel || 'Modéré',
          weeklyInsight: aiAnalysis.trends?.weeklyInsight || 'La compétition reste active'
        },
        generatedAt: new Date()
      };

      this.loggingService.trace(`✅ Résumé IA généré pour ${analytics.region}`);
      return summary;

    } catch (error) {
      this.loggingService.error(`Échec de génération du résumé IA pour ${analytics.region} :`, error);
      if (error instanceof Error) {
        this.loggingService.error(`Message d'erreur : ${error.message}`);
        this.loggingService.error(`Stack trace : ${error.stack}`);
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
    
    let prompt = `Analyse les données du championnat de tennis de table pour la région ${region}, semaine ${weekName} :

APERÇU DE LA RÉGION :
- Total de joueurs actifs : ${totalPlayers}
- Nombre de clubs : ${clubs.length}
- Clubs participants : ${clubs.join(', ')}

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
      
      // Petit délai pour respecter les limites de taux
      if (summaries.length < analyticsArray.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = summaries.filter(s => s !== null).length;
    this.loggingService.info(`✅ Généré ${successCount}/${analyticsArray.length} résumés IA`);
    
    return summaries;
  }

  async generateFacebookPost(analytics: RegionAnalytics): Promise<string | null> {
    if (!this.openai) {
      this.loggingService.warn(`Saut de la génération de post Facebook pour ${analytics.region} - OpenAI non initialisé`);
      return null;
    }

    try {
      this.loggingService.info(`Génération du post Facebook pour la région ${analytics.region}, semaine ${analytics.weekName}`);

      const prompt = this.buildFacebookPostPrompt(analytics);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
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
        max_completion_tokens: 2500,
        response_format: { type: "text" }
      });

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
        this.loggingService.error(`Stack trace : ${error.stack}`);
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
      
      // Petit délai pour respecter les limites de taux
      if (posts.length < analyticsArray.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = posts.filter(p => p !== null).length;
    this.loggingService.info(`✅ Généré ${successCount}/${analyticsArray.length} posts Facebook`);
    
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
    
    let prompt = `Crée un post Facebook engageant pour le championnat de tennis de table de la région ${region}, semaine ${weekName}.

CONTEXTE DE LA RÉGION :
- Total de joueurs actifs : ${totalPlayers}
- Nombre de clubs participants : ${clubs.length}
- Clubs : ${clubs.join(', ')}

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