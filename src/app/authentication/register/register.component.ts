import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
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
    private authService: AuthService, 
    private tokenStorage: TokenStorageService,
    private router: Router
  ) {}

  ngOnInit(): void {}

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

      sexe:this.form.sexe
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

  signInWithGoogle() {
    console.log("Connexion avec Google");
    // Implémentation future
  }

  signInWithFacebook() {
    console.log("Connexion avec Facebook");
    // Implémentation future
  }

  signInWithGithub() {
    console.log("Connexion avec GitHub");
    // Implémentation future
  }
}
