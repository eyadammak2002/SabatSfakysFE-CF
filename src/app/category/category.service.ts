import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category } from './category';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private http: HttpClient) {}
  get() {
    return this.http.get<Category[]>('http://127.0.0.1:8080/category');
  }
  create(payload: Category) {
    return this.http.post<Category>('http://127.0.0.1:8080/category', payload);
  }
  getById(id: number) {
    return this.http.get<Category>(`http://127.0.0.1:8080/category/${id}`);
   }
    
   update(payload:Category){
    return this.http.put(`http://127.0.0.1:8080/category`,payload);
   }
   delete(id:number){
    return this.http.delete<Category>(`http://127.0.0.1:8080/category/${id}`);
 }
}
