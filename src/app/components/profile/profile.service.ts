import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Fournisseur } from 'src/app/pack/Fournisseur';


export interface Client {
  id: number;
  nom: string;
  email: string;
  adresse?: string;
  telephone?: string;
  sexe?: string;
}

@Injectable({
  providedIn: 'root'
})


export class ProfileService {
  private apiUrl = 'http://localhost:8080'; // Ajustez selon votre configuration

  constructor(private http: HttpClient) { }

  // Récupérer tous les clients
  getAllClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}/client`);
  }

  // Récupérer un client par ID
  getClientById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/client/${id}`);
  }

  // Récupérer un client par email
  getClientByEmail(email: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/client/email/${email}`);
  }

  // Créer un nouveau client
  createClient(client: Client): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/client`, client);
  }

  // Mettre à jour un client
  updateClient(id: number, client: Client): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/client/${id}`, client);
  }

  // Supprimer un client
  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/client/${id}`);
  }
  



    // Récupérer tous les clients
    getAllFournisseurs(): Observable<Fournisseur[]> {
      return this.http.get<Fournisseur[]>(`${this.apiUrl}/fournisseur`);
    }
  
    // Récupérer un client par ID
    getFournisseurById(id: number): Observable<Fournisseur> {
      return this.http.get<Fournisseur>(`${this.apiUrl}/fournisseur/${id}`);
    }
  
    // Récupérer un client par email
    getFournisseurByEmail(email: string): Observable<Fournisseur> {
      return this.http.get<Fournisseur>(`${this.apiUrl}/fournisseur/email/${email}`);
    }
  
    // Créer un nouveau client
    createFournisseur(fournisseur: Fournisseur): Observable<number> {
      return this.http.post<number>(`${this.apiUrl}/fournisseur`, fournisseur);
    }
  
    // Mettre à jour un client
    updateFournisseur(id: number, fournisseur: Fournisseur): Observable<Fournisseur> {
      return this.http.put<Fournisseur>(`${this.apiUrl}/fournisseur/${id}`, fournisseur);
    }
  
    // Supprimer un client
    deleteFournisseur(id: number): Observable<void> {
      return this.http.delete<void>(`${this.apiUrl}/fournisseur/${id}`);
    }
}