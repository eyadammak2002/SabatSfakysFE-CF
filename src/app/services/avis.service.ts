import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Photo } from '../photo/Photo';
import { Article } from '../article/article';
import { Genre } from '../produit/Genre';

export interface Avis {
  id?: number;
  description: string;
  dateAjout?: string;
  photos: Photo[];
  client?: Client;
  article?: Article;
}

export interface Client {
  id?: number;
  username: string;
  email: string;
  adresse: string;
  telephone: string;
  password?: string;
  sexe?: Genre;
}

@Injectable({
  providedIn: 'root'
})
export class AvisService {
  private apiUrl = 'http://localhost:8080/api/avis';
  private apiUrl1 = 'http://localhost:8080/panier';
  private apiUrl2 = 'http://localhost:8080/client';

  constructor(private http: HttpClient) {}

  // Récupérer tous les avis
  getAllAvis(): Observable<Avis[]> {
    return this.http.get<Avis[]>(this.apiUrl);
  }

  // Récupérer un avis par ID
  getAvisById(id: number): Observable<Avis> {
    return this.http.get<Avis>(`${this.apiUrl}/${id}`);
  }

  // Créer un nouvel avis avec clientId au lieu de userId
  createAvis(avis: any, clientId: number, articleId: number): Observable<Avis> {
    console.log("Création d'avis avec clientId:", clientId, "articleId:", articleId);
    
    // S'assurer que clientId est un nombre
    const clientIdNum = Number(clientId);
    if (isNaN(clientIdNum)) {
      console.error("clientId n'est pas un nombre valide:", clientId);
      return throwError(() => new Error("ID client invalide"));
    }
    
    // Créer un nouvel objet pour éviter d'envoyer des propriétés inutiles
    const avisData = {
      description: avis.description,
      note: avis.note,
      // Envoyer uniquement les photos nécessaires avec leur ID
      photos: avis.photos.map((photo: Photo) => ({
        id: photo.id,
        name: photo.name
      }))
    };

    // Envoi de la requête avec clientId au lieu de userId
    return this.http.post<Avis>(
      `${this.apiUrl}?clientId=${clientIdNum}&articleId=${articleId}`, 
      avisData
    ).pipe(
      tap(response => console.log('Réponse du serveur:', response)),
      catchError(error => {
        console.error('Erreur lors de la création de l\'avis:', error);
        return throwError(() => error);
      })
    );
  }

  getClientIdByEmail(email: string): Observable<number> {
    console.log("Récupération du client pour l'email:", email);
    return this.http.get<any>(`${this.apiUrl2}/email/${email}`).pipe(
      tap(client => console.log("Client récupéré:", client)),
      map(client => {
        if (client && typeof client.id === 'number') {
          return client.id;
        } else if (client && typeof client.id === 'string') {
          return Number(client.id);
        } else {
          console.error("ID client invalide ou manquant:", client);
          throw new Error("ID client invalide ou manquant");
        }
      }),
      catchError(error => {
        console.error("Erreur lors de la récupération du client:", error);
        return throwError(() => error);
      })
    );
  }

  getFournisseurIdByEmail(email: string): Observable<number> {
  console.log("Récupération du fournisseur pour l'email:", email);
  return this.http.get<any>(`${this.apiUrl}/fournisseur/email/${email}`).pipe(
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

  // Récupérer l'utilisateur d'un avis
  getUserFromAvis(avisId: number): Observable<any> {
    // Changer l'endpoint de /user à /client pour correspondre au backend
    return this.http.get<any>(`${this.apiUrl}/${avisId}/client`).pipe(
      tap(userData => console.log(`Données client récupérées pour l'avis ${avisId}:`, userData)),
      catchError(error => {
        console.error(`Erreur lors de la récupération des données client pour l'avis ${avisId}:`, error);
        return throwError(() => error);
      })
    );
  }

  // Modifier un avis existant
  updateAvis(id: number, avis: Avis): Observable<Avis> {
    return this.http.put<Avis>(`${this.apiUrl}/${id}`, avis);
  }

  // Supprimer un avis
  deleteAvis(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAvisByArticleId(articleId: number): Observable<Avis[]> {
    return this.http.get<Avis[]>(`${this.apiUrl}/article/${articleId}`);
  }

  // Vérifier si un utilisateur a déjà acheté un article spécifique
  verifierAchatArticle(clientId: number, articleId: number): Observable<boolean> {
    // S'assurer que clientId est un nombre
    const clientIdNum = Number(clientId);
    if (isNaN(clientIdNum)) {
      console.error("clientId n'est pas un nombre valide dans verifierAchatArticle:", clientId);
      return throwError(() => new Error("ID client invalide"));
    }
    
    console.log(`Vérification achat pour clientId: ${clientIdNum}, articleId: ${articleId}`);
    return this.http.get<boolean>(`${this.apiUrl1}/verification/${clientIdNum}/${articleId}`);
  }
}