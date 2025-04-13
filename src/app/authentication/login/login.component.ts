import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from 'src/app/services/Authentication.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
import { PanierService } from 'src/app/services/panier.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  form: any = {
    username: null,
    password: null
  };
  
  isLoggedIn = false;
  errorMessage = '';
  returnUrl: string = '/accueil';

  constructor(
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
        }
      });
    }
  }

  onSubmit(): void {
    if (!this.form.username || !this.form.password) {
      this.errorMessage = "Veuillez remplir tous les champs.";
      return;
    }
    
    this.authService.login(this.form.username, this.form.password).subscribe(
      data => {
        console.log('Connexion réussie', data);
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