import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Client {
  id: number;
  nom: string;
  email: string;
  adresse: string;
  telephone: string;
  sexe: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private baseUrl = 'http://localhost:8080'; // Ajustez selon votre configuration

  constructor(private http: HttpClient) { }

  // Récupérer un client par email
  getClientByEmail(email: string): Observable<Client> {
    return this.http.get<Client>(`${this.baseUrl}/client/email/${email}`);
  }

  // Récupérer le téléphone d'un client par son ID
  getClientTelephone(clientId: number): Observable<string> {
    return this.http.get(`${this.baseUrl}/client/${clientId}/telephone`, { 
      responseType: 'text' 
    });
  }

  // Mettre à jour le téléphone d'un client
  updateClientTelephone(clientId: number, telephone: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/client/${clientId}/telephone`, telephone, {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}