import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from './forget-password/user';

@Injectable({
  providedIn: 'root'
})
export class ForgetpasswordService {
  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}
 

  
  findByEmail(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/forgetpassword/${email}`,{responseType:'text'});
  } 

  reinitialisation(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/reinitialiserpassword/${email}`,{responseType:'text'});
  } 
  
  envoiNouveauPassword(confirmPassword: string,token:string): Observable<any> {
    return this.http.post(`${this.apiUrl}/confirmPassword/${confirmPassword}/${token}`,{responseType:'text'});
  } 
  
  
    
}
