import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Photo } from '../photo/Photo';
import { Article } from '../article/article';
import { Genre } from '../produit/Genre';

export interface Reclamation {
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
export class ReclamationService {
  private apiUrl = 'http://localhost:8080/api/reclamation';
  private apiUrl2 = 'http://localhost:8080/client';

  constructor(private http: HttpClient) {}

  // Récupérer tous les reclamation
  getAllReclamation(): Observable<Reclamation[]> {
    return this.http.get<Reclamation[]>(this.apiUrl);
  }

  // Récupérer un reclamation par ID
  getReclamationById(id: number): Observable<Reclamation> {
    return this.http.get<Reclamation>(`${this.apiUrl}/${id}`);
  }

  createReclamation(reclamation: any, clientId: number, articleId: number): Observable<Reclamation> {
    console.log("Création de réclamation avec clientId:", clientId, "articleId:", articleId);
    
    // S'assurer que clientId est un nombre
    const clientIdNum = Number(clientId);
    if (isNaN(clientIdNum)) {
      console.error("clientId n'est pas un nombre valide:", clientId);
      return throwError(() => new Error("ID client invalide"));
    }
    
    // Créer un nouvel objet pour éviter d'envoyer des propriétés inutiles
    const reclamationData = {
      description: reclamation.description,
      // Envoyer uniquement les photos nécessaires avec leur ID
      photos: reclamation.photos.map((photo: Photo) => ({
        id: photo.id,
        name: photo.name
      }))
    };

    // Utiliser clientId dans l'URL correctement formaté comme un nombre
    return this.http.post<Reclamation>(
      `${this.apiUrl}?clientId=${clientIdNum}&articleId=${articleId}`, 
      reclamationData
    ).pipe(
      tap(response => console.log('Réponse du serveur:', response)),
      catchError(error => {
        console.error('Erreur lors de la création de la réclamation:', error);
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
  
  // Récupérer l'utilisateur d'un reclamation
  getUserFromReclamation(reclamationId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${reclamationId}/client`);
  }

  // Modifier un reclamation existant
  updateReclamation(id: number, reclamation: Reclamation): Observable<Reclamation> {
    return this.http.put<Reclamation>(`${this.apiUrl}/${id}`, reclamation);
  }

  // Supprimer un reclamation
  deleteReclamation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getReclamationByArticleId(articleId: number): Observable<Reclamation[]> {
    return this.http.get<Reclamation[]>(`${this.apiUrl}/article/${articleId}`);
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
    return this.http.get<boolean>(`${this.apiUrl}/verification/${clientIdNum}/${articleId}`);
  }

  getReclamationsByClientId(clientId: number): Observable<Reclamation[]> {
    // S'assurer que clientId est un nombre
    const clientIdNum = Number(clientId);
    if (isNaN(clientIdNum)) {
      console.error("clientId n'est pas un nombre valide:", clientId);
      return throwError(() => new Error("ID client invalide"));
    }
    
    console.log(`Récupération des réclamations pour le client ID: ${clientIdNum}`);
    return this.http.get<Reclamation[]>(`${this.apiUrl}/client/${clientIdNum}`).pipe(
      tap(reclamations => console.log(`${reclamations.length} réclamations récupérées pour le client ID ${clientIdNum}`)),
      catchError(error => {
        console.error(`Erreur lors de la récupération des réclamations pour le client ID ${clientIdNum}:`, error);
        return throwError(() => error);
      })
    );
  }
}