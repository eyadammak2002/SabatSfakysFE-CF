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
      { question: "Qu'est-ce que Sabat Sfakys ?", answer: "Sabat Sfakys est une marketplace disponible sur site web et application mobile, qui permet aux marques et aux artisans de créer leur propre boutique. Elle offre une plateforme pour vendre des chaussures, des sacs, des articles éco-responsables et artisanaux, ainsi que des chaussures personnalisées adaptées aux besoins spécifiques." },
      { question: "Qui êtes-vous ?", answer: "Nous sommes Sabat Sfakys, une plateforme marketplace qui permet aux marques et aux artisans de créer leur propre boutique pour vendre des chaussures, des sacs, et des produits personnalisés. Nous mettons l'accent sur des articles éco-responsables, artisanaux et adaptés aux besoins spécifiques." },
      { question: "Quand a été créé Sabat Sfakys ?", answer: "Le projet Sabat Sfakys a été lancé en janvier 2020 dans le cadre d'un appel d'offres du ministère tunisien de l'Enseignement supérieur. Il s'inscrit dans une initiative de valorisation des résultats de la recherche (VRR) sur trois ans, visant à intégrer l'artisanat traditionnel de la médina de Sfax dans une démarche durable et innovante. Le projet a impliqué plusieurs institutions académiques, des artisans locaux, des entreprises et des associations, avec un accent particulier sur la transformation numérique et la gestion responsable des déchets." },
      { question: "Où se trouve votre entreprise ?", answer: "Notre entreprise, Sabat Sfakys, est localisée à la Faculté de Médecine de Sfax, située sur l'avenue Majida Boulila, 3029 Sfax, Tunisie. Le projet est dirigé par le Pr Imed Gargouri, chef de projet." },
      { question: "Quels sont vos horaires d'ouverture ?", answer: "Sabat Sfakys est disponible 24h/24 et 7j/7. Vous pouvez accéder à notre marketplace à tout moment, où que vous soyez.." },
      
      // Questions sur les produits/services
{
  "question": "Quels services proposez-vous ?",
  "answer": "Sabat Sfakys propose les services suivants :\n\n1. **Marketplace pour marques et artisans** : Permet de créer une boutique en ligne pour vendre des produits artisanaux, des chaussures, des sacs et des articles personnalisés.\n2. **Vente de produits éco-responsables** : Mise en avant de produits respectueux de l'environnement.\n3. **Chaussures personnalisées** : Offre des chaussures adaptées aux besoins spécifiques des clients.\n4. **Gestion des réclamations** : Permet aux clients de soumettre des réclamations concernant leurs achats.\n5. **Facilité de navigation et d'achat en ligne** : Interface intuitive pour faciliter l'expérience d'achat pour les clients et de vente pour les vendeurs."
},
{
  question: "Quels sont vos produits ?",
  answer: "Sabat Sfakys propose une large gamme de produits, incluant :\n\n1. **Chaussures** : Une variété de chaussures pour hommes, femmes et enfants, y compris des chaussures personnalisées adaptées aux besoins spécifiques.\n2. **Sacs** : Des sacs à main, sacs à dos, et autres accessoires de mode.\n3. **Produits artisanaux** : Des articles fabriqués à la main par des artisans locaux, respectueux de l'environnement et uniques.\n4. **Articles éco-responsables** : Des produits fabriqués de manière durable et avec des matériaux respectueux de la nature."
},
{
  question: "Quels sont vos tarifs ?",
  answer: "Les tarifs sur Sabat Sfakys varient en fonction des produits proposés par les marques et les artisans. Chaque vendeur définit ses propres prix pour ses articles. Vous pouvez consulter les prix directement sur les pages des produits de notre marketplace. Nous nous efforçons de proposer des produits de qualité à des prix compétitifs tout en favorisant des articles éco-responsables et artisanaux."
},
{
  question: "Faites-vous des promotions ?",
  answer: "Oui, Sabat Sfakys propose régulièrement des promotions et des offres spéciales. Les vendeurs peuvent offrir des réductions, des ventes flash, ou des promotions sur certains produits. Nous vous encourageons à visiter notre plateforme fréquemment pour profiter des meilleures offres et des remises sur vos produits préférés."
},
{
  question: "Avez-vous un catalogue ?",
  answer: "Oui, Sabat Sfakys dispose d'un catalogue en ligne. Vous pouvez consulter une large sélection de produits proposés par les marques et les artisans présents sur notre marketplace. Chaque produit est détaillé avec des informations sur ses caractéristiques, son prix et ses options. Nous vous invitons à parcourir notre site ou notre application pour découvrir notre offre complète."
},
      
      // Questions sur le compte utilisateur
{
  question: "Comment créer un compte ?",
  answer: "Pour créer un compte sur Sabat Sfakys, suivez ces étapes :\n\n1. **Accédez** à notre site web ou ouvrez notre application mobile.\n2. Cliquez sur le bouton **'S'inscrire'** situé sur la page d'accueil.\n3. Remplissez le formulaire d'inscription avec vos informations personnelles (nom, email, mot de passe, etc.).\n4. Si vous êtes un **vendeur**, vous devrez également fournir des informations supplémentaires pour créer votre boutique.\n5. Validez votre inscription et vous recevrez un email de confirmation pour activer votre compte.\n\nUne fois votre compte activé, vous pouvez vous connecter et commencer à explorer notre marketplace."
},
{
  question: "Comment me connecter à mon compte ?",
  answer: "Pour vous connecter à votre compte sur Sabat Sfakys, suivez ces étapes :\n\n1. Ouvrez notre site web ou notre application mobile.\n2. Cliquez sur le bouton **'Se connecter'** situé sur la page d'accueil.\n3. Entrez votre email et votre mot de passe associés à votre compte.\n4. Cliquez sur le bouton **'Se connecter'** pour accéder à votre espace personnel.\n\nSi vous avez oublié votre mot de passe, cliquez sur **'Mot de passe oublié ?'** pour réinitialiser votre mot de passe."
},
{
  question: "J'ai oublié mon mot de passe",
  answer: "Si vous avez oublié votre mot de passe, suivez ces étapes pour le réinitialiser :\n\n1. Allez sur la page de connexion de Sabat Sfakys.\n2. Cliquez sur le lien **'Mot de passe oublié ?'**.\n3. Entrez l'adresse email associée à votre compte.\n4. Vous recevrez un email avec un lien pour réinitialiser votre mot de passe.\n5. Cliquez sur le lien dans l'email et suivez les instructions pour créer un nouveau mot de passe.\n\nSi vous ne recevez pas l'email, vérifiez votre dossier de spam ou contactez notre support."
},
{
  question: "Comment modifier mes informations personnelles ?",
  answer: "Pour modifier vos informations personnelles sur Sabat Sfakys, suivez ces étapes :\n\n1. Connectez-vous à votre compte sur notre site web ou notre application mobile.\n2. Accédez à votre profil en cliquant sur l'icône de votre profil dans le menu.\n3. Dans votre espace personnel, cliquez sur **'Modifier mes informations'**.\n4. Mettez à jour vos informations personnelles (nom, email, mot de passe, etc.).\n5. Cliquez sur **'Enregistrer'** pour valider vos modifications.\n\nSi vous avez des difficultés à modifier vos informations, n'hésitez pas à contacter notre support."
},
{
  question: "Comment supprimer mon compte ?",
  answer: "Si vous souhaitez supprimer votre compte sur Sabat Sfakys, suivez ces étapes :\n\n1. Connectez-vous à votre compte sur notre site web ou notre application mobile.\n2. Accédez à votre profil en cliquant sur l'icône de votre profil dans le menu.\n3. Dans les paramètres de votre compte, sélectionnez l'option **'Supprimer mon compte'**.\n4. Confirmez votre décision en suivant les instructions à l'écran.\n\nVeuillez noter que la suppression de votre compte est définitive et que toutes vos données seront supprimées. Si vous avez des questions ou des préoccupations avant de supprimer votre compte, contactez notre support."
},
      
      // Questions sur les commandes
{
  question: "Comment passer une commande ?",
  answer: "Pour passer une commande sur Sabat Sfakys, suivez ces étapes :\n\n1. Parcourez notre marketplace et choisissez les produits que vous souhaitez acheter.\n2. Sur chaque page de produit, sélectionnez les options souhaitées (taille, couleur, quantité, etc.).\n3. Ajoutez les produits à votre **panier** en cliquant sur le bouton **'Ajouter au panier'**.\n4. Lorsque vous avez terminé vos achats, cliquez sur l'icône du panier pour passer à **'acheter'**.\n5. Vérifiez votre commande, puis cliquez sur **'Passer à l'achat'**.\n6. Saisissez vos informations de livraison et choisissez votre méthode de paiement.\n7. Finalisez votre commande en cliquant sur **'Confirmer l'achat'**.\n\nVous recevrez un email de confirmation une fois la commande validée. Vous pourrez suivre l'état de votre commande directement sur votre espace client."
},
{
  question: "Comment suivre ma commande ?",
  answer: "Pour suivre votre commande sur Sabat Sfakys, suivez ces étapes :\n\n1. Connectez-vous à votre compte sur notre site web ou application mobile.\n2. Accédez à votre espace personnel en cliquant sur l'icône de votre profil.\n3. Dans votre espace client, allez dans la section **'Mes commandes'**.\n4. Sélectionnez la commande que vous souhaitez suivre.\n5. Vous y trouverez les informations sur l'état de votre commande, y compris le statut d'expédition et le suivi de livraison.\n\nSi vous avez des questions concernant la livraison ou l'état de votre commande, n'hésitez pas à contacter notre support."
},
{
  question: "Quelles sont vos modes de paiement ?",
  answer: "Nous acceptons les méthodes de paiement suivantes sur Sabat Sfakys :\n\n1. **Carte bancaire** (Visa, MasterCard, etc.)\n2. **PayPal**\n3. **Achat à la livraison**\n\nCes options sont disponibles selon le vendeur et la région. Vous pouvez choisir la méthode de paiement qui vous convient lors du passage à l'achat."
},{
  question: "Quelles sont vos modes de payement ?",
  answer: "Nous acceptons les méthodes de paiement suivantes sur Sabat Sfakys :\n\n1. **Carte bancaire** (Visa, MasterCard, etc.)\n2. **PayPal**\n3. **Achat à la livraison**\n\nCes options sont disponibles selon le vendeur et la région. Vous pouvez choisir la méthode de paiement qui vous convient lors du passage à l'achat."
},
{
  question: "Quelles sont vos méthodes de paiement ?",
  answer: "Nous acceptons les méthodes de paiement suivantes sur Sabat Sfakys :\n\n1. **Carte bancaire** (Visa, MasterCard, etc.)\n2. **PayPal**\n3. **Achat à la livraison**\n\nCes options sont disponibles selon le vendeur et la région. Vous pouvez choisir la méthode de paiement qui vous convient lors du passage à l'achat."
},
{
  question: "Comment annuler ma commande ?",
  answer: "Pour annuler une commande sur Sabat Sfakys, suivez ces étapes :\n\n1. Connectez-vous à votre compte sur notre site web ou application mobile.\n2. Accédez à votre espace personnel en cliquant sur l'icône de votre profil.\n3. Allez dans la section **'Mes commandes'**.\n4. Sélectionnez la commande que vous souhaitez annuler.\n5. Si la commande est encore en préparation et n'a pas été expédiée, vous verrez un bouton **'Annuler la commande'**. Cliquez dessus pour annuler votre commande.\n\nSi la commande a déjà été expédiée, il ne sera pas possible de l'annuler, mais vous pourrez initier un retour une fois la commande livrée. Si vous avez des questions supplémentaires, n'hésitez pas à contacter notre support."
},
{
  question: "Quel est le délai de livraison ?",
  answer: "Le délai de livraison sur Sabat Sfakys dépend de plusieurs facteurs, notamment du vendeur et de la destination. En général, voici les délais estimés :\n\n1. **Livraison standard** : entre 3 et 7 jours ouvrés.\n2. **Livraison express** : entre 1 et 3 jours ouvrés, selon la disponibilité du produit et votre région.\n\nVeuillez noter que les délais de livraison peuvent varier en fonction de la disponibilité des produits, des conditions logistiques et de votre localisation. Vous pouvez suivre l'état de votre livraison directement depuis votre espace client une fois la commande expédiée."
},
      
      // Questions sur la livraison
{
  question: "Proposez-vous la livraison ?",
  answer: "Oui, Sabat Sfakys propose la livraison pour toutes les commandes passées sur notre marketplace. Les options de livraison varient en fonction du vendeur et de votre localisation. En général, nous offrons les options suivantes :\n\n1. **Livraison standard** : Livraison dans un délai de 3 à 7 jours ouvrés.\n2. **Livraison express** : Livraison accélérée dans un délai de 1 à 3 jours ouvrés, selon la disponibilité du produit.\n\nLors de votre commande, vous pourrez choisir la méthode de livraison qui vous convient. Vous recevrez également un numéro de suivi pour suivre l'état de votre livraison."
},
{
  question: "La livraison est-elle gratuite ?",
  answer: "Vous n’aurez donc aucun frais de livraison, quel que soit le poids, la taille des articles ou votre localisation.Cette gratuité s’applique automatiquement et sera visible lors du passage à l’achat, avant la confirmation de votre commande."
},
{
  question: "Livrez-vous à l'international ?",
  answer: "Actuellement, Sabat Sfakys ne propose pas la livraison à l'international. Nous livrons uniquement dans les pays où nos vendeurs sont en mesure de traiter les commandes. Pour plus de détails sur les options de livraison disponibles, vous pouvez consulter les informations lors du passage à l'achat. Si vous avez des questions, n'hésitez pas à contacter notre support."
},
{
  question: "Comment suivre ma livraison ?",
  answer: "Pour suivre votre livraison sur Sabat Sfakys :\n\n1. Connectez-vous à votre compte sur notre site web ou application mobile.\n2. Accédez à votre espace personnel en cliquant sur votre profil.\n3. Ouvrez la section **'Ma commande'**.\n4. Sélectionnez la commande concernée pour voir les détails de livraison et le numéro de suivi.\n\nVous pourrez ainsi suivre en temps réel l'état de votre livraison. En cas de problème, n'hésitez pas à contacter notre service client."
},
      
      // Questions sur les retours et remboursements
{
  question: "Quelle est votre politique de retour ?",
  answer: "Chez Sabat Sfakys, vous disposez de **48 heures** après la réception de votre commande pour demander un retour. Le produit doit être dans son état d'origine, non utilisé et dans son emballage d'origine.\n\nPour initier un retour :\n1. Connectez-vous à votre compte.\n2. Rendez-vous dans la section **'Mes commandes'**.\n3. Sélectionnez la commande concernée et cliquez sur **'Demander un retour'**.\n\nNotre équipe traitera votre demande dès réception. Pour plus d'informations, vous pouvez consulter notre support client."
},
{
  question: "Comment faire un retour ?",
  answer: "Pour faire un retour sur Sabat Sfakys :\n\n1. Connectez-vous à votre compte sur notre site web ou application mobile.\n2. Accédez à votre espace personnel en cliquant sur votre profil.\n3. Rendez-vous dans la section **'Mes commandes'**.\n4. Sélectionnez la commande concernée et cliquez sur **'Demander un retour'**.\n5. Suivez les instructions pour finaliser votre demande.\n\nN'oubliez pas que vous devez effectuer votre demande de retour dans un délai de **48 heures** après réception du produit et que l'article doit être dans son état d'origine."
},
{
  question: "Dans quel délai serai-je remboursé ?",
  answer: "Après validation de votre demande de retour et réception du produit, le remboursement sera effectué sous **7 à 14 jours ouvrés**. Le délai peut varier en fonction de votre méthode de paiement et de votre banque. Vous recevrez une notification dès que le remboursement sera traité."
},
      
      // Support client
{
  question: "Comment contacter le service client ?",
  answer: "Vous pouvez contacter notre service client de Sabat Sfakys par :\n\n- **Téléphone** : 97 458 500\n- **Email** : sabat.sfakys-vrr@usf.tn\n\nNotre équipe est à votre écoute pour répondre à toutes vos questions et vous accompagner."
},
      {
  question: "Avez-vous un numéro de téléphone ?",
  answer: "Oui, vous pouvez nous joindre au 97 458 500 du lundi au samedi, de 9h00 à 18h00."
},
{
  question: "Avez-vous une adresse email ?",
  answer: "Oui, vous pouvez nous contacter à sabat.sfakys-vrr@usf.tn à tout moment."
},

      // Questions techniques
{
  question: "L'application est-elle disponible sur mobile ?",
  answer: "Oui, notre application Sabat Sfakys est disponible sur mobile, sur les plateformes **Android** et **iOS**."
},
{
  question: "Comment installer l'application ?",
  answer: "Pour installer l'application Sabat Sfakys :\n\n- Rendez-vous sur le **Google Play Store** si vous utilisez un appareil Android.\n- Rendez-vous sur l'**App Store** si vous utilisez un iPhone.\n- Rendez-vous sur l'**AppGallery** si vous utilisez un appareil Huawei.\n\nRecherchez **'Sabat Sfakys'**, téléchargez l'application, puis installez-la gratuitement."
},
{
  question: "Comment mettre à jour l'application ?",
  answer: "Pour mettre à jour l'application Sabat Sfakys :\n\n- Sur **Google Play Store**, ouvrez le Play Store, recherchez **'Sabat Sfakys'**, et cliquez sur **Mettre à jour** si une mise à jour est disponible.\n- Sur **App Store**, ouvrez l'App Store, accédez à l'onglet **Mises à jour**, puis appuyez sur **Mettre à jour** à côté de l'application **Sabat Sfakys**.\n- Sur **AppGallery**, ouvrez l'AppGallery, accédez à **Mes applications**, puis appuyez sur **Mettre à jour** si une nouvelle version est disponible."
},
{
  question: "J'ai un problème technique",
  answer: "Si vous rencontrez un problème technique, veuillez contacter notre support technique à **sabat.sfakys-vrr@usf.tn** ou appeler le **97 458 500**. Notre équipe est disponible pour résoudre rapidement toute difficulté rencontrée."
},
      
      // Salutations et remerciements
      { question: "Bonjour", answer: "Bonjour ! Comment puis-je vous aider aujourd'hui ?" },
      { question: "Salut", answer: "Salut ! En quoi puis-je vous être utile ?" },
      { question: "Merci", answer: "Je vous en prie ! N'hésitez pas si vous avez d'autres questions." },
      { question: "Au revoir", answer: "Au revoir ! Merci d'avoir discuté avec nous. À bientôt !" },
      { question: "Bonne journée", answer: "Merci, je vous souhaite également une excellente journée !" },
      
      // Questions diverses
{
  question: "Avez-vous des offres d'emploi ?",
  answer: "Actuellement, nous n'avons pas d'offres d'emploi disponibles. Cependant, vous pouvez envoyer votre candidature spontanée à **sabat.sfakys-vrr@usf.tn** et nous la garderons dans nos fichiers pour de futures opportunités."
},
{
  question: "Avez-vous un programme de fidélité ?",
  answer: "Actuellement, Sabat Sfakys ne propose pas de programme de fidélité. Cependant, nous offrons régulièrement des promotions et des offres spéciales. Abonnez-vous à notre newsletter pour être informé des dernières offres et nouveautés."
},
{
  question: "Êtes-vous présent sur les réseaux sociaux ?",
  answer: "Oui, Sabat Sfakys est présent sur plusieurs réseaux sociaux ! Vous pouvez nous suivre pour découvrir nos nouveautés et offres spéciales sur :\n\n- **Facebook**\n- **Instagram**\n- **Twitter**\n\nRejoignez-nous pour rester connecté et ne rien manquer !"
},
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