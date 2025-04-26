import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/Authentication.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';

@Component({
  selector: 'app-login-fournisseur',
  standalone: true, 
  imports: [CommonModule, FormsModule], 
  templateUrl: './login-fournisseur.component.html',
  styleUrls: ['./login-fournisseur.component.css']
})
export class LoginFournisseurComponent {
  form: any = {
    username: null,
    password: null
  };

  isLoggedIn = false;
  errorMessage = '';

  constructor(
    private authService: AuthenticationService,
    private tokenStorage: TokenStorageService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.form.username || !this.form.password) {
      this.errorMessage = "Veuillez remplir tous les champs.";
      return;
    }
  
    this.authService.loginFournisseur(this.form.username, this.form.password).subscribe(
      data => {
        console.log('Connexion réussie', data);
        this.tokenStorage.saveToken(data.accessToken);
        this.tokenStorage.saveUser(data);
        this.isLoggedIn = true;
        localStorage.setItem("token", data.accessToken);
        
        // Rediriger vers la page des articles/produits du fournisseur
        this.router.navigate(['/article']);
      },
      err => {
        console.error('Erreur de connexion', err);
        
        // Si le statut est 403 (Forbidden) et que le message indique que c'est un client
        if (err.status === 403 && err.error && err.error.message) {
          if (err.error.message.includes("Vous n'êtes pas un fournisseur")) {
            // Rediriger vers la page de connexion client
            this.errorMessage = "Vous êtes un client, redirection vers la page de connexion client...";
            
            // Attendre quelques secondes avant de rediriger pour que l'utilisateur puisse lire le message
            setTimeout(() => {
              this.router.navigate(['auth/client/login']);
            }, 3000);
          } else {
            // Autres messages d'erreur 403 (comme compte en attente ou refusé)
            this.errorMessage = err.error.message;
          }
        } else {
          // Autres erreurs
          this.errorMessage = "Nom d'utilisateur ou mot de passe incorrect";
        }
      }
    );
  }
  
//
  goBack(): void {
    this.router.navigate(['/accueil']);
  }
    

}