import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Photo } from '../photo/Photo';
import { TokenRequest } from '../authentication/TokenRequest';
import { TokenStorageService } from './token-storage.service';
import { PanierService } from './panier.service';
import { Router, ActivatedRoute } from '@angular/router';

// Interface pour typer la réponse de l'API
interface AuthResponse {
  accessToken?: string;
  id?: number;
  username?: string;
  email?: string;
  role: string;
  role2: string;
  // autres propriétés que votre API pourrait renvoyer
}

const AUTH_API = 'http://localhost:8080/api/auth/';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  constructor(
    private http: HttpClient, 
    private tokenStorage: TokenStorageService,
    private panierService: PanierService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  loginWithGoogle(tokenRequest: TokenRequest): Observable<any> {
    console.log(tokenRequest, "token service");
    return this.http.post<AuthResponse>(AUTH_API + 'google', tokenRequest, httpOptions).pipe(
      tap(data => {
        // Après une connexion réussie
        if (data.accessToken) {
          this.tokenStorage.saveToken(data.accessToken);
          this.tokenStorage.saveUser(data);
          
          // Mettre à jour le clientId dans le panier et fusionner le panier invité
          if (data.id) {
            this.panierService.mettreAJourClientId(data.id);
            this.panierService.fusionnerPanierInvite();
          }
          
          // Vérifier s'il y a une URL de retour
          this.route.queryParams.subscribe(params => {
            const returnUrl = params['returnUrl'];
            if (returnUrl) {
              this.router.navigateByUrl(returnUrl);
            }
          });
        }
      })
    );
  }

  // Renommer cette méthode pour le login fournisseur
loginFournisseur(username: string, password: string): Observable<any> {
  return this.http.post<AuthResponse>(AUTH_API + 'signinFR', {
    username,
    password
  }, httpOptions).pipe(
    tap(data => {
      if (data.accessToken) {
        // Mettre à jour le clientId et fusionner le panier invité si nécessaire
        if (data.id) {
          this.panierService.mettreAJourClientId(data.id);
          this.panierService.fusionnerPanierInvite();
        }
      }
    })
  );
}

loginClient(username: string, password: string): Observable<any> {
  return this.http.post<AuthResponse>(AUTH_API + 'signinCLIENT', {
    username,
    password
  }, httpOptions).pipe(
    tap(data => {
      if (data.accessToken) {
        // Mettre à jour le clientId et fusionner le panier invité
        if (data.id) {
          this.panierService.mettreAJourClientId(data.id);
          this.panierService.fusionnerPanierInvite();
        }
        
        // Vérifier s'il y a une URL de retour
        this.route.queryParams.subscribe(params => {
          const returnUrl = params['returnUrl'];
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
          }
        });
      }

      // Vérifions si c'est un fournisseur qui se connecte en tant que client
      if (data.role && data.role.includes('ROLE_FOURNISSEUR')) {
        // On conserve le rôle fournisseur dans role2
        data.role2 = 'ROLE_FOURNISSEUR';
        // On définit le rôle actif comme client
        data.role = 'ROLE_CLIENT';
      }
    })
  );
}

  register(username: string, email: string, password: string, adresse: string, telephone: string, sexe: string): Observable<any> {
    return this.http.post(AUTH_API + 'signup', {
      username,
      email,
      password,
      adresse,
      telephone,
      sexe,
    }, httpOptions);
  }

  registerFournisseur(username: string, email: string, password: string, adresse: string, logo: Photo, telephone: string, numeroIdentificationEntreprise: string, materiauxUtilises: string, methodesProduction: string, programmeRecyclage: string, transportLogistiqueVerte: string, initiativesSociales: string, scoreEcologique: number): Observable<any> {
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
      statut: "EN_ATTENTE",
      role: "ROLE_FOURNISSEUR",
    }, httpOptions);
  }
}