import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Photo } from 'src/app/photo/Photo';
import { PhotoService } from 'src/app/photo/photo.service';
import { AuthenticationService} from 'src/app/services/Authentication.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';

@Component({
  selector: 'app-register-fournisseur',
  standalone: true, 
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './register-fournisseur.component.html',
  styleUrls: ['./register-fournisseur.component.css']
})
export class RegisterFournisseurComponent implements OnInit {
  allPhoto: Photo[] = [];
  materiauxOptions = ['Cuir', 'Coton bio', 'Textile recyclé'];
  methodesProductionOptions = ['Énergie renouvelable', 'Production locale', 'Sans déchet'];
  programmeRecyclageOptions = ['Acceptation de retours usagés', 'Recyclage sur place'];
  transportLogistiqueOptions = ['Transport neutre en carbone', 'Livraison verte'];
  initiativesSocialesOptions = ['Collaboration avec artisans locaux', 'Insertion professionnelle'];

  form: any = {
    username: null,
    email: null,
    adresse: null,
    telephone: null,
    password: null,
    statut: 'EN_ATTENTE',
    logo: { id: 0, name: '', url: '' },
    numeroIdentificationEntreprise: null,
    materiauxUtilises: null,
    methodesProduction: null,
    programmeRecyclage: null,
    transportLogistiqueVerte: null,
    initiativesSociales: null,
    scoreEcologique: null,
  };
  
  
  isSuccessful = false;
  isRegisterFailed = false;
  errorMessage = '';
  
  constructor(
    private authService: AuthenticationService, 
    private tokenStorage: TokenStorageService,
    private router: Router,
    private photoService: PhotoService
  ) {}

  ngOnInit(): void {
    this.getPhotos();
  }

  onSubmit(): void {
    // Vérification des champs
    if (!this.form.username || !this.form.email || !this.form.password || !this.form.telephone|| !this.form.adresse|| !this.form.logo|| !this.form.numeroIdentificationEntreprise || !this.form.materiauxUtilises || !this.form.methodesProduction || !this.form.programmeRecyclage || !this.form.transportLogistiqueVerte || !this.form.initiativesSociales || !this.form.scoreEcologique) {
      this.errorMessage = "Tous les champs obligatoires doivent être remplis.";
      this.isRegisterFailed = true;
      return;
    }

    const userData = {
      username:this.form.username,
      email: this.form.email,
      telephone:this.form.telephone,
      adresse:this.form.adresse,
      logo:this.form.logo,
      password: this.form.password,
      statut: 'EN_ATTENTE',
      numeroIdentificationEntreprise:this.form.numeroIdentificationEntreprise,
      materiauxUtilises:this.form.materiauxUtilises,
      methodesProduction:this.form.methodesProduction,
      programmeRecyclage:this.form.programmeRecyclage,
      transportLogistiqueVerte:this.form.transportLogistiqueVerte,
      initiativesSociales:this.form.initiativesSociales,
      scoreEcologique:this.form.scoreEcologique,

      
    };

    this.authService.registerFournisseur(userData.username, userData.email, userData.password,userData.adresse,userData.logo,userData.telephone ,userData.numeroIdentificationEntreprise,userData.materiauxUtilises ,userData.methodesProduction ,userData.programmeRecyclage ,userData.transportLogistiqueVerte ,userData.initiativesSociales ,userData.scoreEcologique ).subscribe(
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
  getPhotos(): void {
    this.photoService.get().subscribe({
      next: (data) => (this.allPhoto = data),
      error: (err) => console.error(err)
    });
  }

  reloadPage(): void {
    this.router.navigate(['/auth/fournisseur/login']);
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


}
