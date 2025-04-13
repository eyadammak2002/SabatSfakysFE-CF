import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/Authentication.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
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

    this.authService.login(this.form.username, this.form.password,).subscribe(
      data => {
        console.log('Connexion réussie', data);
        this.tokenStorage.saveToken(data.accessToken);
        this.tokenStorage.saveUser(data);
        this.isLoggedIn = true;
        localStorage.setItem("token",data.accessToken);
        this.router.navigate(['/accueil']);
      },
      err => {
        console.error('Erreur de connexion', err);
        this.errorMessage = "Nom d'utilisateur ou mot de passe incorrect";
      }
    );
  }

  goBack(): void {
    this.router.navigate(['/accueil']);
  }
  
  signInWithGoogle() {
    console.log("Connexion avec Google");
  }

  signInWithFacebook() {
    console.log("Connexion avec Facebook");
  }

  signInWithGithub() {
    console.log("Connexion avec GitHub");
  }
}
