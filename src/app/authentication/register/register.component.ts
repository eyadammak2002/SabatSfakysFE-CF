import { GoogleLoginProvider, GoogleSigninButtonModule, SocialAuthService } from '@abacritt/angularx-social-login';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService} from 'src/app/services/Authentication.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
import { TokenRequest } from '../TokenRequest';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule,GoogleSigninButtonModule, // Assure-toi que ce module est importé si tu veux utiliser ce bouton
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  private accessToken = '';
  private tokenRequest:TokenRequest=new TokenRequest();
  user:any;
  isLoggedIn: boolean = false;  // Par défaut, l'utilisateur n'est pas connecté

  form: any = {
    username: null,
    email: null,
    adresse: null,
    telephone: null,
    password: null,
    sexe: null,
  };
  
  isSuccessful = false;
  isRegisterFailed = false;
  errorMessage = '';

  constructor(
    private authServiceGoogle: SocialAuthService, 
    private authService: AuthenticationService, 
    private tokenStorage: TokenStorageService,
    private router: Router,

  ) {}

  ngOnInit(): void {
    // Automatically listen for login changes
    this.authServiceGoogle.authState.subscribe(user => {
      this.user = user;
      if (user) {
        this.accessToken = user.idToken;
        console.log("User signed in:", user);
        console.log("Access Token:", this.accessToken);
        setTimeout(()=>{
          this.signinGoogle();
        },3000)
      }
    });
  }
  

 /* signinGoogle():void{
    this.tokenRequest.token=this.accessToken;
    console.log(this.tokenRequest);
    this.authService.loginWithGoogle(this.tokenRequest).subscribe(
      data => {
        console.log(data);
        this.router.navigate(['/accueil']);
      })
  }*/
      signinGoogle(): void {
        this.tokenRequest.token = this.accessToken;
        console.log("🔄 Envoi du token Google à l'API...", this.tokenRequest);
      
        this.authService.loginWithGoogle(this.tokenRequest).subscribe(
          data => {
            console.log("Réponse de l'API après connexion Google:", data);
      
            if (!data || !data.accessToken) {
              console.error("❌ L'API ne retourne pas un `accessToken` valide !");
              return;
            }
      
            //Corrige l'accès aux données utilisateur
            const user = {
              id: data.id,
              username: data.username,
              email: data.email,
              role: data.role,
            };
      
            //Sauvegarde le token & utilisateur
            this.tokenStorage.saveToken(data.accessToken);
            this.tokenStorage.saveUser(user);
      
            // Mise à jour de `isLoggedIn`
            this.isLoggedIn = !!this.tokenStorage.getToken();
            console.log("isLoggedIn après Google Login:", this.isLoggedIn);
      
            // Redirection vers la page d'accueil
            this.router.navigate(['/accueil']);
          },
          err => {
            console.error("❌ Erreur lors de la connexion Google:", err);
          }
        );
      }
      
      





  onSubmit(): void {
    // Vérification des champs
    if (!this.form.username || !this.form.email || !this.form.password || !this.form.telephone|| !this.form.adresse|| !this.form.sexe) {
      this.errorMessage = "Tous les champs obligatoires doivent être remplis.";
      this.isRegisterFailed = true;
      return;
    }

    const userData = {
      username:this.form.username,
      email: this.form.email,
      telephone:this.form.telephone,
      adresse:this.form.adresse,
      password: this.form.password,
      sexe:this.form.sexe,
    
    };

    this.authService.register(userData.username, userData.email, userData.password,userData.adresse,userData.telephone ,userData.sexe).subscribe(
      data => {
        console.log('Inscription réussie :', data);
        this.isSuccessful = true;
        this.isRegisterFailed = false;

        // Sauvegarde utilisateur (sans token car API ne le retourne pas)
        this.tokenStorage.saveUser(data);

        this.reloadPage();
      },
      err => {
        console.error('Erreur lors de l’enregistrement :', err);
        this.errorMessage = err.error.message || 'Enregistrement échoué';
        this.isRegisterFailed = true;
      }
    );
  }

  reloadPage(): void {
    this.router.navigate(['/auth/client/login']);
  }

  goBack(): void {
    this.router.navigate(['/accueil']);
  }

  getAccessToken(): void {
    this.authServiceGoogle.getAccessToken(GoogleLoginProvider.PROVIDER_ID).then(accessToken => {this.accessToken = accessToken
      console.log(this.accessToken);
    });
  }
  
  signInWithGoogle() {
    if (this.authServiceGoogle) {
        console.log("Connexion avec Google");
        console.log(GoogleLoginProvider.PROVIDER_ID);
        this.authServiceGoogle.signIn(GoogleLoginProvider.PROVIDER_ID).then(user => {
         
            console.log("token google :", user.idToken);
            this.getAccessToken();
        }).catch(error => {
            console.error('Erreur lors de la connexion avec Google:', error);
        });
    } else {
        console.error('authServiceGoogle est undefined');
    }
}

  signInWithFacebook() {
    console.log("Connexion avec Facebook");
    // Implémentation future
  }


}
