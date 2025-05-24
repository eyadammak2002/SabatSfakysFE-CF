// services/contact.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContactRequest } from './contact.model';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = 'http://localhost:8080/api'; // Ajustez selon votre configuration

  constructor(private http: HttpClient) { }

  sendContactEmail(contactRequest: ContactRequest): Observable<any> {
    // Spécifiez le type de réponse comme texte pour éviter le parsing JSON automatique
    return this.http.post(`${this.apiUrl}/contact/send-email`, contactRequest, {
      responseType: 'text',
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }
}