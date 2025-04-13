import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Photo } from '../photo/Photo';
import { TokenRequest } from '../authentication/TokenRequest';

const AUTH_API = 'http://localhost:8080/api/auth/';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  constructor(private http: HttpClient) { }

  loginWithGoogle(tokenRequest:TokenRequest): Observable<any> {
    console.log(tokenRequest,"token service");
    return this.http.post(AUTH_API + 'google', 
      tokenRequest, httpOptions);
  }

  /*loginWithGoogle(tokenRequest: { token: string }): Observable<any> {
    console.log("Envoi du token Google au backend :", tokenRequest);

    return this.http.post<any>(AUTH_API + 'google', tokenRequest, httpOptions).pipe(
      tap(response => {
        console.log("Réponse du backend après authentification Google :", response);

        if (response.accessToken) {
          localStorage.setItem('token', response.accessToken); // 🔥 Stocke le bon JWT
        }
      })
    );
  }*/
    loginTestClient(username: string, password: string, userType: string ): Observable<any> {
      return this.http.post(AUTH_API + 'signin/FR', {
        username,
        password,
        userType  // Cette information sera envoyée au backend
      }, httpOptions);
    }

    login(username: string, password: string): Observable<any> {
      return this.http.post(AUTH_API + 'signin', {
        username,
        password,
      }, httpOptions);
    }


  register(username: string, email: string, password: string,adresse:string,telephone:string,sexe:string): Observable<any> {
    return this.http.post(AUTH_API + 'signup', {
      username,
      email,
      password,
      adresse,
      telephone,
      sexe,
 
    }, httpOptions);
  }
  registerFournisseur(username: string, email: string, password: string,adresse:string,logo:Photo,telephone:string,numeroIdentificationEntreprise:string ,materiauxUtilises:string,methodesProduction:string,programmeRecyclage:string,transportLogistiqueVerte:string,initiativesSociales:string,scoreEcologique:number): Observable<any> {
    return this.http.post(AUTH_API + 'signup', {
      username,
      email,
      password,
      adresse,
      telephone,
      logo,
      numeroIdentificationEntreprise,
      materiauxUtilises,
      methodesProduction,
      programmeRecyclage,
      transportLogistiqueVerte,
      initiativesSociales,
      scoreEcologique,
      statut: "EN_ATTENTE" , // ✅ Ajout du statut
      role: "ROLE_FOURNISSEUR",
   
    }, httpOptions);
  }
}
