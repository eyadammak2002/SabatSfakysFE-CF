import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OpenAIResponse } from '../components/OpenAIResponse';

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private apiUrl = 'http://localhost:8080/api/ai';

  constructor(private http: HttpClient) { }

  generateResponse(prompt: string): Observable<OpenAIResponse> {
    return this.http.post<OpenAIResponse>(`${this.apiUrl}/generate`, prompt);
  }
}