import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Article } from './article';
import { Observable } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private apiUrl = 'http://127.0.0.1:8080/article';

  constructor(private http: HttpClient) {}
  
  
  get() {
    return this.http.get<Article[]>('http://127.0.0.1:8080/article');
  }
    // Créer un nouvel article
    create(article: Article): Observable<number> {
      return this.http.post<number>(this.apiUrl, article);
    }
  
  getById(id: number) {
    return this.http.get<Article>(`http://127.0.0.1:8080/article/${id}`);
   }
    
   update(id: number, article: Article): Observable<Article> {
    return this.http.put<Article>(`http://127.0.0.1:8080/article/${id}`, article, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }
  
  
   delete(id:number){
    return this.http.delete<Article>(`http://127.0.0.1:8080/article/${id}`);
 }
}
