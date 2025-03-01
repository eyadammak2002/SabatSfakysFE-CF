import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Fruits } from './fruits';
@Injectable({
  providedIn: 'root'
})
export class FruitsService {
  constructor(private http: HttpClient) {}
  get() {
    return this.http.get<Fruits[]>('http://127.0.0.1:8080/article');
  
  }
  
  create(payload: Fruits) {
    return this.http.post<Fruits>('http://127.0.0.1:8080/article', payload);
  }
  getById(id: number) {
    return this.http.get<Fruits>(`http://127.0.0.1:8080/article/${id}`);
   }
    
   update(payload:Fruits){
    return this.http.put(`http://127.0.0.1:8080/article`,payload);
   }
   delete(id:number){
    return this.http.delete<Fruits>(`http://127.0.0.1:8080/article/${id}`);
   }

 
}



 
