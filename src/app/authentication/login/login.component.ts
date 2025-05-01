import { GoogleLoginProvider, GoogleSigninButtonModule, SocialAuthService } from '@abacritt/angularx-social-login';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthenticationService } from 'src/app/services/Authentication.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
import { PanierService } from 'src/app/services/panier.service';
import { TokenRequest } from '../TokenRequest';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, GoogleSigninButtonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private accessToken = '';
  private tokenRequest: TokenRequest = new TokenRequest();
  user: any;
  
  form: any = {
    username: null,
    password: null
  };
  
  isLoggedIn = false;
  errorMessage = '';
  returnUrl: string = '/accueil';

  constructor(
    private authServiceGoogle: SocialAuthService,
    private authService: AuthenticationService,
    private tokenStorage: TokenStorageService,
    private router: Router,
    private route: ActivatedRoute,
    private panierService: PanierService
  ) {}

  ngOnInit(): void {
    // Vérifier si l'utilisateur est déjà connecté
    if (this.tokenStorage.getToken()) {
      this.isLoggedIn = true;
      
      // Récupérer l'URL de retour des paramètres de requête
      this.route.queryParams.subscribe(params => {
        this.returnUrl = params['returnUrl'] || '/accueil';
        
        // Si déjà connecté et URL de retour présente, rediriger immédiatement
        if (this.isLoggedIn && params['returnUrl']) {
          this.router.navigateByUrl(this.returnUrl);
        }
      });
    } else {
      // Récupérer l'URL de retour
      this.route.queryParams.subscribe(params => {
        if (params['returnUrl']) {
          this.returnUrl = params['returnUrl'];
          localStorage.setItem('returnUrl', this.returnUrl);
        }
      });
    }

    // Écouter les changements d'authentification Google
    this.authServiceGoogle.authState.subscribe(user => {
      this.user = user;
      if (user) {
        this.accessToken = user.idToken;
        console.log("User signed in:", user);
        console.log("Access Token:", this.accessToken);
        setTimeout(() => {
          this.signinGoogle();
        }, 2000);
      }
    });
  }

  getQueryParams() {
    return {
      returnUrl: this.route.snapshot.queryParams['returnUrl']
    };
  }

  onSubmit(): void {
    if (!this.form.username || !this.form.password) {
      this.errorMessage = "Veuillez remplir tous les champs.";
      return;
    }
      
    this.authService.loginClient(this.form.username, this.form.password).subscribe(
      data => {
        console.log('Connexion réussie', data);
        
        // Avant de sauvegarder l'utilisateur, vérifiez s'il est fournisseur
        if (data.roles && data.roles.includes('ROLE_FOURNISSEUR')) {
          console.log('Fournisseur se connectant comme client');
          // Si c'est un fournisseur, forcez le rôle actif à ROLE_CLIENT
          data.role = 'ROLE_CLIENT';
          data.role2 = 'ROLE_FOURNISSEUR';
        }
        
        this.tokenStorage.saveToken(data.accessToken);
        this.tokenStorage.saveUser(data);
        this.isLoggedIn = true;
        localStorage.setItem("token", data.accessToken);
          
        // Mettre à jour le clientId dans le panier
        if (data.id) {
          this.panierService.mettreAJourClientId(data.id);
          // Fusionner le panier invité
          this.panierService.fusionnerPanierInvite();
        }
          
        // Rediriger vers l'URL de retour si disponible
        this.router.navigate([this.returnUrl]);
      },
      err => {
        console.error('Erreur lors de la connexion :', err);
        this.errorMessage = err.error?.message || 'Connexion échouée. Vérifiez vos identifiants.';
      }
    );
  }

  signinGoogle(): void {
    this.tokenRequest.token = this.accessToken;
    console.log("Sending Google token:", this.tokenRequest);
    
    this.authService.loginWithGoogle(this.tokenRequest).subscribe(
      data => {
        // Sauvegarder les détails de l'utilisateur
        const user = {
          id: data.id,
          username: data.username,
          email: data.email,
          role: data.role,
        };

        // Sauvegarder le token et les détails de l'utilisateur
        this.tokenStorage.saveToken(data.accessToken);
        this.tokenStorage.saveUser(user);
        localStorage.setItem("token", data.accessToken);

        // Mettre à jour le statut de connexion
        this.isLoggedIn = true;
        console.log("isLoggedIn after Google Login:", this.isLoggedIn);
        
        // Mettre à jour le clientId dans le panier si disponible
        if (data.id) {
          this.panierService.mettreAJourClientId(data.id);
          // Fusionner le panier invité
          this.panierService.fusionnerPanierInvite();
        }

        // Récupérer returnUrl depuis localStorage ou utiliser la valeur par défaut
        const savedReturnUrl = localStorage.getItem('returnUrl');
        const returnUrl = savedReturnUrl || '/accueil';
        
        // Nettoyer localStorage
        if (savedReturnUrl) {
          localStorage.removeItem('returnUrl');
        }
        
        this.router.navigate([returnUrl]);
      },
      err => {
        console.error("Google Login Error:", err);
        this.errorMessage = err.error?.message || "Erreur lors de la connexion avec Google";
      }
    );
  }

  goBack(): void {
    this.router.navigate(['/accueil']);
  }

  getAccessToken(): void {
    this.authServiceGoogle.getAccessToken(GoogleLoginProvider.PROVIDER_ID).then(accessToken => {
      this.accessToken = accessToken;
      console.log("Access token récupéré:", this.accessToken);
    });
  }
  
  signInWithGoogle() {
    if (this.authServiceGoogle) {
      console.log("Connexion avec Google");
      this.authServiceGoogle.signIn(GoogleLoginProvider.PROVIDER_ID).then(user => {
        console.log("Token Google:", user.idToken);
        this.getAccessToken();
      }).catch(error => {
        console.error('Erreur lors de la connexion avec Google:', error);
      });
    } else {
      console.error('authServiceGoogle est undefined');
    }
  }
}