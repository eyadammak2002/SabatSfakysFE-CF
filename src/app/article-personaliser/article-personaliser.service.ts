import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { Photo } from '../photo/Photo';
import { Category } from '../category/category';
import { Couleur, Pointure } from '../article/article';
import { Client } from '../services/avis.service';
import { Fournisseur } from '../pack/Fournisseur';
import { TokenStorageService } from '../services/token-storage.service';

// Configuration de l'API
const API_CONFIG = {
  apiBaseUrl: 'http://localhost:8080/api'
};

// Interface pour les messages chat
export interface ChatMessage {
  type: string;
  content: string;
  sender: string;
  senderId: number;
  timestamp: string;
  room?: string;
  recipientId?: number;
  articlePersonaliserId?: number;
  systemMessage?: boolean;
}

// Interfaces pour les modèles
export interface ArticlePersonaliser {
  id?: number;
  ref: string;
  name: string;
  description: string;
  quantite?: number;
  genre?: string;
  tissu?: string;
  statut: string;
  categorie?: string; // Ajouté pour compatibilité avec le filtrage
  photos: Photo[];
  category: Category;
  dateAjout?: Date;
  client: Client;
  fournisseur?: Fournisseur; // Ajout du fournisseur
  couleurs?: Couleur[];
  pointures?: Pointure[];
  nom?: string; // Ajouté pour compatibilité avec le composant (name/nom)
}

@Injectable({
  providedIn: 'root'
})
export class ArticlePersonaliserService {
  private apiUrl = 'http://127.0.0.1:8080/api/articlePersonaliser';  
  private apiUrl1 = 'http://127.0.0.1:8080/article';
  private fournisseurApiUrl = 'http://127.0.0.1:8080/fournisseur';
  private chatApiUrl = 'http://127.0.0.1:8080/api/chat';
  private apiUrl3 = 'http://127.0.0.1:8080';
  

  constructor(private http: HttpClient,    private tokenStorage: TokenStorageService,
  ) { }

  // === MÉTHODES POUR LES ARTICLES PERSONNALISÉS ===

  // Récupérer tous les fournisseurs
  getAllFournisseurs(): Observable<Fournisseur[]> {
    return this.http.get<Fournisseur[]>(this.fournisseurApiUrl);
  }

  get(): Observable<ArticlePersonaliser[]> {
    return this.getAllArticlePersonalisers();
  }

  getAllArticlePersonalisers(): Observable<ArticlePersonaliser[]> {
    return this.http.get<ArticlePersonaliser[]>(this.apiUrl);
  }

  getById(id: number): Observable<ArticlePersonaliser> {
    return this.getArticlePersonaliserById(id);
  }

  getArticlePersonaliserById(id: number): Observable<ArticlePersonaliser> {
    return this.http.get<ArticlePersonaliser>(`${this.apiUrl}/${id}`);
  }

  getArticlesPersonalisesByStatut(statut: string): Observable<ArticlePersonaliser[]> {
    return this.getArticlePersonalisersByStatut(statut);
  }

  getArticlePersonalisersByStatut(statut: string): Observable<ArticlePersonaliser[]> {
    return this.http.get<ArticlePersonaliser[]>(`${this.apiUrl}/statut/${statut}`);
  }

  getArticlePersonalisersAujourdhui(): Observable<ArticlePersonaliser[]> {
    return this.http.get<ArticlePersonaliser[]>(`${this.apiUrl}/aujourdhui`);
  }

  createArticlePersonaliser(article: ArticlePersonaliser, emailClient: string, fournisseurId: number): Observable<ArticlePersonaliser> {
    // Ajout du fournisseurId dans les paramètres de requête
    return this.http.post<ArticlePersonaliser>(
      `${this.apiUrl}/create`, 
      article,
      {
        params: new HttpParams()
          .set('emailClient', emailClient)
          .set('fournisseurId', fournisseurId.toString()),
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      }
    );
  }

  update(id: number, article: ArticlePersonaliser, emailClient: string, fournisseurId?: number): Observable<ArticlePersonaliser> {
    return this.updateArticlePersonaliser(id, article, emailClient, fournisseurId);
  }

  updateArticlePersonaliser(id: number, article: ArticlePersonaliser, emailClient: string, fournisseurId?: number): Observable<ArticlePersonaliser> {
    console.log('ArticlePersonaliser envoyé au backend lors update :', article, 'Email Client:', emailClient, 'Fournisseur ID:', fournisseurId);
    
    let params = new HttpParams().set('emailClient', emailClient);
    if (fournisseurId) {
      params = params.set('fournisseurId', fournisseurId.toString());
    }

    return this.http.put<ArticlePersonaliser>(`${this.apiUrl}/${id}/update`, article, { 
      params,
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la mise à jour:', error.message, error);
        return throwError(() => new Error(error.message || 'Erreur inconnue'));
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Erreur lors de la suppression:', error.message, error);
        return throwError(() => new Error(error.message || 'Erreur inconnue'));
      })
    );
  }

  deleteArticlePersonaliser(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`);
  }

  getPhotoByName(name: string): Observable<any> {
    return this.http.get<any>(`${API_CONFIG.apiBaseUrl}/photos/name/${name}`);
  }
  
  deletePhoto(id: number): Observable<any> {
    if (id === undefined || id === null) {
      throw new Error('L\'ID de la photo est undefined ou null');
    }
    return this.http.delete<any>(`${this.apiUrl}/photos/${id}`);
  }

  notifierArticlePersonaliser(message: string): Observable<any> {
    return this.http.post('http://127.0.0.1:8080/api/notification/article', message);
  }

  getAllArticlesPersonalises(): Observable<ArticlePersonaliser[]> {
    return this.http.get<ArticlePersonaliser[]>(this.apiUrl)
      .pipe(
        tap(articles => console.log(`${articles.length} articles personnalisés récupérés`)),
        catchError(error => {
          console.error('Erreur lors de la récupération des articles personnalisés:', error);
          return throwError(() => error);
        })
      );
  }

  getArticlesPersonalisesByEmail(email: string): Observable<ArticlePersonaliser[]> {
    return this.http.get<ArticlePersonaliser[]>(`${this.apiUrl}/client/email/${email}`)
      .pipe(
        tap(articles => console.log(`${articles.length} articles personnalisés récupérés pour l'email ${email}`)),
        catchError(error => {
          console.error(`Erreur lors de la récupération des articles personnalisés pour l'email ${email}:`, error);
          return throwError(() => error);
        })
      );
  }

  // Récupérer toutes les couleurs
  getCouleurs(): Observable<Couleur[]> {
    return this.http.get<Couleur[]>(`${this.apiUrl}/couleurs`);
  }
    
  // Récupérer toutes les pointures
  getPointures(): Observable<Pointure[]> {
    return this.http.get<Pointure[]>(`${this.apiUrl}/pointures`);
  }

  // Récupérer les articles par fournisseur
  getArticlePersonalisersByFournisseur(fournisseurId: number): Observable<ArticlePersonaliser[]> {
    return this.http.get<ArticlePersonaliser[]>(`${this.apiUrl}/fournisseur/${fournisseurId}`);
  }
  
  // === MÉTHODES POUR LE CHAT ===
  
  // Récupérer l'historique des messages d'un article
  getChatHistoryForArticle(articleId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.chatApiUrl}/history/article/${articleId}`);
  }
  
  // Marquer un message comme lu
  markMessageAsRead(messageId: number, userId: number): Observable<any> {
    return this.http.post(`${this.chatApiUrl}/markAsRead`, {
      messageId: messageId,
      userId: userId
    });
  }
  
  // Obtenir le nombre de messages non lus
  getUnreadMessagesCount(userId: number): Observable<number> {
    return this.http.get<number>(`${this.chatApiUrl}/unread/${userId}`);
  }
  
  changeArticleStatus(articleId: number, newStatus: string, message: string, fournisseurId: number): Observable<ArticlePersonaliser> {
    return this.http.put<ArticlePersonaliser>(`${this.apiUrl}/${articleId}/status`, null, {
        params: new HttpParams()
            .set('newStatus', newStatus)
            .set('message', message || '')
            .set('frId', fournisseurId.toString())
    });
}

getFournisseurIdByEmail(email: string): Observable<number> {
  console.log("Récupération du fournisseur pour l'email:", email);
  return this.http.get<any>(`${this.apiUrl3}/fournisseur/email/${email}`).pipe(
    tap(fournisseur => console.log("Fournisseur récupéré:", fournisseur)),
    map(fournisseur => {
      if (fournisseur && typeof fournisseur.id === 'number') {
        return fournisseur.id;
      } else if (fournisseur && typeof fournisseur.id === 'string') {
        return Number(fournisseur.id);
      } else {
        console.error("ID fournisseur invalide ou manquant:", fournisseur);
        throw new Error("ID fournisseur invalide ou manquant");
      }
    }),
    catchError(error => {
      console.error("Erreur lors de la récupération du fournisseur:", error);
      return throwError(() => error);
    })
  );
}

// Ajoutez cette méthode à votre ArticlePersonaliserService
getCurrentFournisseurId(): Promise<number | null> {
  const user = this.tokenStorage.getUser(); // Vous devrez injecter TokenStorageService dans le constructeur
  
  // Vérifier si l'utilisateur est connecté
  if (!user || !user.email) {
    console.log("Aucun utilisateur connecté");
    return Promise.resolve(null);
  }
  
  const email = user.email;
  console.log("Recherche du fournisseur pour l'email:", email);
  
  // Vérifier si l'ID fournisseur est déjà disponible dans le token
  if (user.fournisseurId && !isNaN(Number(user.fournisseurId))) {
    const fournisseurIdNum = Number(user.fournisseurId);
    console.log("ID fournisseur trouvé dans le token:", fournisseurIdNum);
    return Promise.resolve(fournisseurIdNum);
  }
  
  // Sinon faire l'appel API pour récupérer l'ID fournisseur
  return this.getFournisseurIdByEmail(email).toPromise()
    .then(fournisseurId => {
      if (fournisseurId !== null && fournisseurId !== undefined) {
        // S'assurer que c'est un nombre
        const fournisseurIdNum = Number(fournisseurId);
        if (!isNaN(fournisseurIdNum)) {
          console.log("Fournisseur ID obtenu depuis l'API:", fournisseurIdNum);
          // Stocker l'ID dans le localStorage pour éviter de refaire l'appel
          const currentUser = this.tokenStorage.getUser();
          currentUser.fournisseurId = fournisseurIdNum;
          this.tokenStorage.saveUser(currentUser);
          return fournisseurIdNum;
        } else {
          console.error("L'API a renvoyé un ID fournisseur qui n'est pas un nombre:", fournisseurId);
          return null;
        }
      } else {
        console.warn("L'API a renvoyé un ID fournisseur null ou undefined");
        return null;
      }
    })
    .catch(error => {
      console.error("Erreur lors de la récupération du fournisseur ID:", error);
      // Si on a une erreur 404, c'est probablement que l'utilisateur est connecté
      // mais n'est pas enregistré comme fournisseur
      if (error.status === 404) {
        console.warn("Utilisateur connecté mais non enregistré comme fournisseur");
        alert("Votre compte utilisateur n'est pas associé à un profil fournisseur. Veuillez compléter votre profil.");
      }
      return null;
    });
}
}