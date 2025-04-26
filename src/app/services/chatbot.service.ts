import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import { USEModelWrapper } from '../use-model-wrapper';
import { configureTensorFlow } from '../tensorflow-config';


export interface Message {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private model: any;
  private knowledgeBase: { question: string, answer: string }[] = [];
  private questionEmbeddings: any[] = [];
  private modelLoaded = new BehaviorSubject<boolean>(false);
  
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  constructor(private http: HttpClient) {
    configureTensorFlow();
    this.loadModel();
    this.loadKnowledgeBase();
  }
  
  async loadModel() {
    try {
      const originalModel = await use.load();
      this.model = new USEModelWrapper(originalModel);
      this.modelLoaded.next(true);
      console.log('Modèle chargé avec succès');
      await this.prepareEmbeddings();
    } catch (error) {
      console.error('Erreur lors du chargement du modèle:', error);
    }
  }
  
// Charger la base de connaissances
async loadKnowledgeBase() {
  try {
    this.knowledgeBase = [
      // Questions générales sur l'entreprise
      { question: "Qu'est-ce que Sabat Sfakys ?", answer: "Sabat Sfakys est [description de votre entreprise, produits ou services]." },
      { question: "Qui êtes-vous ?", answer: "Nous sommes Sabat Sfakys, [brève description de votre activité]." },
      { question: "Quand a été créé Sabat Sfakys ?", answer: "Sabat Sfakys a été fondé en [année de création]." },
      { question: "Où se trouve votre entreprise ?", answer: "Notre siège social est situé à [adresse]. Nous avons également des bureaux à [autres emplacements si applicable]." },
      { question: "Quels sont vos horaires d'ouverture ?", answer: "Nos horaires d'ouverture sont [détails des horaires]." },
      
      // Questions sur les produits/services
      { question: "Quels services proposez-vous ?", answer: "Nous proposons [liste de vos services principaux]." },
      { question: "Quels sont vos produits ?", answer: "Notre gamme de produits comprend [liste de vos produits principaux]." },
      { question: "Quels sont vos tarifs ?", answer: "Nos tarifs varient selon les services. Vous pouvez consulter notre grille tarifaire complète sur [lien ou emplacement]." },
      { question: "Faites-vous des promotions ?", answer: "Oui, nous proposons régulièrement des promotions. Consultez notre page [lien] pour découvrir nos offres actuelles." },
      { question: "Avez-vous un catalogue ?", answer: "Oui, vous pouvez consulter notre catalogue complet sur [lien ou emplacement]." },
      
      // Questions sur le compte utilisateur
      { question: "Comment créer un compte ?", answer: "Pour créer un compte, cliquez sur le bouton 'S'inscrire' en haut à droite de notre site et suivez les instructions." },
      { question: "Comment me connecter à mon compte ?", answer: "Vous pouvez vous connecter en cliquant sur 'Se connecter' en haut à droite de notre site et en saisissant vos identifiants." },
      { question: "J'ai oublié mon mot de passe", answer: "Pas de problème ! Cliquez sur 'Mot de passe oublié' sur la page de connexion et suivez les instructions pour le réinitialiser." },
      { question: "Comment modifier mes informations personnelles ?", answer: "Connectez-vous à votre compte, puis accédez à 'Mon profil' où vous pourrez modifier vos informations personnelles." },
      { question: "Comment supprimer mon compte ?", answer: "Pour supprimer votre compte, veuillez contacter notre service client à [email ou téléphone]." },
      
      // Questions sur les commandes
      { question: "Comment passer une commande ?", answer: "Pour passer une commande, sélectionnez les produits souhaités, ajoutez-les au panier, puis suivez les étapes du processus de paiement." },
      { question: "Comment suivre ma commande ?", answer: "Vous pouvez suivre votre commande en vous connectant à votre compte et en accédant à la section 'Mes commandes'." },
      { question: "Quelles sont vos méthodes de paiement ?", answer: "Nous acceptons [liste des méthodes de paiement acceptées]." },
      { question: "Comment annuler ma commande ?", answer: "Pour annuler une commande, veuillez contacter notre service client dans les plus brefs délais à [email ou téléphone]." },
      { question: "Quel est le délai de livraison ?", answer: "Le délai de livraison varie généralement entre [X et Y jours]. Vous recevrez une estimation précise lors de votre commande." },
      
      // Questions sur la livraison
      { question: "Proposez-vous la livraison ?", answer: "Oui, nous proposons la livraison [détails des zones de livraison]." },
      { question: "La livraison est-elle gratuite ?", answer: "La livraison est gratuite pour toute commande supérieure à [montant]. Pour les commandes inférieures, des frais de livraison de [montant] s'appliquent." },
      { question: "Livrez-vous à l'international ?", answer: "[Oui/Non], nous [proposons/ne proposons pas] de livraison internationale [détails si applicable]." },
      { question: "Comment suivre ma livraison ?", answer: "Vous recevrez un email avec un numéro de suivi une fois votre commande expédiée. Vous pourrez suivre votre colis en utilisant ce numéro sur [site de suivi]." },
      
      // Questions sur les retours et remboursements
      { question: "Quelle est votre politique de retour ?", answer: "Vous pouvez retourner un produit dans les [nombre] jours suivant la réception. Pour plus de détails, consultez notre page [lien]." },
      { question: "Comment faire un retour ?", answer: "Pour effectuer un retour, contactez notre service client à [email ou téléphone] pour obtenir un numéro de retour, puis suivez les instructions qui vous seront communiquées." },
      { question: "Dans quel délai serai-je remboursé ?", answer: "Une fois votre retour reçu et vérifié, le remboursement est généralement traité sous [nombre] jours ouvrables." },
      
      // Support client
      { question: "Comment contacter le service client ?", answer: "Vous pouvez contacter notre service client par email à [email], par téléphone au [numéro], ou via le formulaire de contact sur notre site." },
      { question: "Avez-vous un numéro de téléphone ?", answer: "Oui, vous pouvez nous joindre au [numéro de téléphone] pendant nos heures d'ouverture." },
      { question: "Avez-vous une adresse email ?", answer: "Oui, vous pouvez nous contacter à [adresse email]." },
      
      // Questions techniques
      { question: "L'application est-elle disponible sur mobile ?", answer: "[Oui/Non], notre application est disponible sur [plateformes : iOS, Android, etc.]." },
      { question: "Comment installer l'application ?", answer: "Vous pouvez télécharger notre application sur [App Store/Google Play] en recherchant 'Sabat Sfakys'." },
      { question: "Comment mettre à jour l'application ?", answer: "L'application se met généralement à jour automatiquement. Si ce n'est pas le cas, vous pouvez la mettre à jour manuellement via [App Store/Google Play]." },
      { question: "J'ai un problème technique", answer: "Pour tout problème technique, veuillez contacter notre support à [email] en décrivant précisément le problème rencontré." },
      
      // Salutations et remerciements
      { question: "Bonjour", answer: "Bonjour ! Comment puis-je vous aider aujourd'hui ?" },
      { question: "Salut", answer: "Salut ! En quoi puis-je vous être utile ?" },
      { question: "Merci", answer: "Je vous en prie ! N'hésitez pas si vous avez d'autres questions." },
      { question: "Au revoir", answer: "Au revoir ! Merci d'avoir discuté avec nous. À bientôt !" },
      { question: "Bonne journée", answer: "Merci, je vous souhaite également une excellente journée !" },
      
      // Questions diverses
      { question: "Avez-vous des offres d'emploi ?", answer: "Pour connaître nos offres d'emploi actuelles, veuillez consulter la section 'Carrières' de notre site ou nous envoyer votre CV à [email]." },
      { question: "Avez-vous un programme de fidélité ?", answer: "[Oui/Non], [détails du programme de fidélité si applicable]." },
      { question: "Êtes-vous présent sur les réseaux sociaux ?", answer: "Oui, vous pouvez nous suivre sur [liste des réseaux sociaux avec liens]." }
    ];
    
    // Option pour charger depuis l'API Spring (à activer plus tard si nécessaire)
    // this.http.get<{ question: string, answer: string }[]>('/api/chatbot/knowledge').subscribe(
    //   data => {
    //     this.knowledgeBase = data;
    //   },
    //   error => console.error('Erreur lors du chargement de la base de connaissances:', error)
    // );
  } catch (error) {
    console.error('Erreur lors du chargement de la base de connaissances:', error);
  }
}
  
  async prepareEmbeddings() {
    if (!this.model || this.knowledgeBase.length === 0) return;
    
    try {
      const questions = this.knowledgeBase.map(item => item.question);
      const embeddings = await this.model.embed(questions);
      this.questionEmbeddings = await embeddings.array();
      console.log('Embeddings préparés avec succès');
    } catch (error) {
      console.error('Erreur lors de la préparation des embeddings:', error);
    }
  }
  
  cosineSimilarity(embeddings1: number[], embeddings2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embeddings1.length; i++) {
      dotProduct += embeddings1[i] * embeddings2[i];
      norm1 += Math.pow(embeddings1[i], 2);
      norm2 += Math.pow(embeddings2[i], 2);
    }
    
    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);
    
    return dotProduct / (norm1 * norm2);
  }
  
  async findBestResponse(userQuestion: string): Promise<string> {
    if (!this.model || this.knowledgeBase.length === 0 || this.questionEmbeddings.length === 0) {
      return "Je me prépare encore, veuillez réessayer dans un instant.";
    }
    
    try {
      // Obtenir l'embedding de la question de l'utilisateur
      const userQuestionEmbedding = await this.model.embed([userQuestion]);
      const userQuestionEmbeddingData = await userQuestionEmbedding.array();
      
      // Trouver la question la plus similaire
      let bestMatchIndex = 0;
      let bestMatchScore = -1;
      
      for (let i = 0; i < this.questionEmbeddings.length; i++) {
        const similarity = this.cosineSimilarity(userQuestionEmbeddingData[0], this.questionEmbeddings[i]);
        if (similarity > bestMatchScore) {
          bestMatchScore = similarity;
          bestMatchIndex = i;
        }
      }
      
      console.log(`Meilleur score: ${bestMatchScore} pour "${this.knowledgeBase[bestMatchIndex].question}"`);
      
      // Si la similarité est trop faible, donner une réponse par défaut
      if (bestMatchScore < 0.5) {
        return "Je ne suis pas sûr de comprendre votre question. Pourriez-vous la reformuler autrement ?";
      }
      
      return this.knowledgeBase[bestMatchIndex].answer;
    } catch (error) {
      console.error('Erreur lors de la recherche de la meilleure réponse:', error);
      return "Désolé, j'ai rencontré une erreur en traitant votre question.";
    }
  }
  
  async sendMessage(message: string): Promise<void> {
    // Ajouter le message de l'utilisateur à l'historique
    const userMessage: Message = {
      content: message,
      isUser: true,
      timestamp: new Date()
    };
    
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, userMessage]);
    
    // Obtenir la réponse du chatbot
    try {
      const response = await this.findBestResponse(message);
      
      // Ajouter la réponse du bot à l'historique
      const botMessage: Message = {
        content: response,
        isUser: false,
        timestamp: new Date()
      };
      
      this.messagesSubject.next([...this.messagesSubject.value, botMessage]);
    } catch (error) {
      console.error('Erreur lors du traitement de la question:', error);
      
      // Ajouter un message d'erreur
      const errorMessage: Message = {
        content: "Désolé, j'ai rencontré une erreur en traitant votre question.",
        isUser: false,
        timestamp: new Date()
      };
      
      this.messagesSubject.next([...this.messagesSubject.value, errorMessage]);
    }
  }
  
  isModelLoaded(): Observable<boolean> {
    return this.modelLoaded.asObservable();
  }
}