//cote FR
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Photo } from '../photo/Photo';
import { Article } from '../article/article';
import { TokenStorageService } from './token-storage.service';

export interface Reclamation {
  id?: number;
  description: string;
  dateAjout?: string;
  photos: Photo[];
  client?: Client;
  article?: Article;
  resolved?: boolean; // Add this property to track resolution status

}
export enum Genre {
  HOMME = "Homme",
  FEMME = "Femme"
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

  constructor(private http: HttpClient,    private tokenStorage: TokenStorageService
  ) {}

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

 // Get unresolved reclamations
 getNonResolvedReclamations(): Observable<Reclamation[]> {
  const url = `${this.apiUrl}/non-resolved`;
  console.log('Fetching non-resolved reclamations from:', url);
  return this.http.get<Reclamation[]>(url).pipe(
    tap(data => console.log('Non-resolved reclamations received:', data.length)),
    catchError(this.handleError('getNonResolvedReclamations', []))
  );
}

// Get resolved reclamations
getResolvedReclamations(): Observable<Reclamation[]> {
  const url = `${this.apiUrl}/resolved`;
  console.log('Fetching resolved reclamations from:', url);
  return this.http.get<Reclamation[]>(url).pipe(
    tap(data => console.log('Resolved reclamations received:', data.length)),
    catchError(this.handleError('getResolvedReclamations', []))
  );
}

// Mark a reclamation as resolved
markReclamationAsResolved(id: number): Observable<Reclamation> {
  const url = `${this.apiUrl}/${id}/resolve`;
  console.log('Marking reclamation as resolved at URL:', url);
  return this.http.put<Reclamation>(url, {}).pipe(
    tap(data => console.log('Reclamation marked as resolved:', data)),
    catchError(this.handleError<Reclamation>('markReclamationAsResolved'))
  );
}

// Get current fournisseur ID from token
async getCurrentFournisseurId(): Promise<number | null> {
  const user = this.tokenStorage.getUser();
  console.log('Current user from token:', user);
  if (user && user.id) {
    console.log('Fournisseur ID from token:', user.id);
    return user.id;
  }
  console.warn('No fournisseur ID found in token');
  return null;
}

// Get resolved reclamations by fournisseur ID
getResolvedReclamationsByFournisseurId(fournisseurId: number): Observable<Reclamation[]> {
  const url = `${this.apiUrl}/fournisseur/${fournisseurId}/resolved`;
  console.log(`Fetching resolved reclamations for fournisseur ${fournisseurId} from URL:`, url);
  return this.http.get<Reclamation[]>(url).pipe(
    tap(data => console.log(`Resolved reclamations for fournisseur ${fournisseurId}:`, data)),
    catchError(error => {
      console.error(`Error retrieving resolved reclamations for fournisseur ${fournisseurId}:`, error);
      console.error('Full error:', JSON.stringify(error));
      return throwError(() => error);
    })
  );
}

// Get unresolved reclamations by fournisseur ID
getNonResolvedReclamationsByFournisseurId(fournisseurId: number): Observable<Reclamation[]> {
  const url = `${this.apiUrl}/fournisseur/${fournisseurId}/non-resolved`;
  console.log(`Fetching non-resolved reclamations for fournisseur ${fournisseurId} from URL:`, url);
  return this.http.get<Reclamation[]>(url).pipe(
    tap(data => console.log(`Non-resolved reclamations for fournisseur ${fournisseurId}:`, data)),
    catchError(error => {
      console.error(`Error retrieving non-resolved reclamations for fournisseur ${fournisseurId}:`, error);
      console.error('Full error:', JSON.stringify(error));
      return throwError(() => error);
    })
  );
}

// Get all reclamations by fournisseur ID
getReclamationsByFournisseurId(fournisseurId: number): Observable<Reclamation[]> {
  const url = `${this.apiUrl}/fournisseur/${fournisseurId}`;
  console.log(`Fetching all reclamations for fournisseur ${fournisseurId} from URL:`, url);
  return this.http.get<Reclamation[]>(url).pipe(
    tap(data => console.log(`All reclamations for fournisseur ${fournisseurId}:`, data.length)),
    catchError(error => {
      console.error(`Error retrieving reclamations for fournisseur ${fournisseurId}:`, error);
      return throwError(() => error);
    })
  );
}

// Helper method to handle errors
private handleError<T>(operation = 'operation', result?: T) {
  return (error: any): Observable<T> => {
    console.error(`${operation} failed:`, error);
    // If you want to send the error to remote logging infrastructure
    console.error(`${operation} error details:`, error.message);
    
    // Let the app keep running by returning an empty result
    return of(result as T);
  };
}
}