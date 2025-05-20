// register-fournisseur.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Photo } from 'src/app/photo/Photo';
import { PhotoService } from 'src/app/photo/photo.service';
import { AuthenticationService} from 'src/app/services/Authentication.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-register-fournisseur',
  standalone: true, 
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './register-fournisseur.component.html',
  styleUrls: ['./register-fournisseur.component.css']
})
export class RegisterFournisseurComponent implements OnInit {
  // Gestion des étapes
  currentStep: number = 1;
  totalSteps: number = 4;
  acceptTerms: boolean = false;
  
  // Données du formulaire et options
  allPhoto: Photo[] = [];
  photosToHide: number[] = []; // IDs des photos à masquer
  newlyUploadedPhotos: Photo[] = [];
  showPassword: boolean = false;
  
  materiauxOptions = ['Cuir', 'Coton bio', 'Textile recyclé'];
  methodesProductionOptions = ['Énergie renouvelable', 'Production locale', 'Sans déchet'];
  programmeRecyclageOptions = ['Acceptation de retours usagés', 'Recyclage sur place'];
  transportLogistiqueOptions = ['Transport neutre en carbone', 'Livraison verte'];
  initiativesSocialesOptions = ['Collaboration avec artisans locaux', 'Insertion professionnelle'];

  // Upload properties
  selectedFiles?: FileList;
  currentFiles: File[] = [];
  progressInfos: { value: number, fileName: string }[] = [];
  uploadMessage: string = '';
  uploadSuccess: boolean = false;
  uploadError: boolean = false;
  
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
    private cdr: ChangeDetectorRef,
    private authService: AuthenticationService, 
    private tokenStorage: TokenStorageService,
    private router: Router,
    private photoService: PhotoService,
    private uploadService: FileUploadService
  ) {}

  ngOnInit(): void {
    this.getPhotos();
  }

  // Méthodes de navigation entre étapes
  nextStep(): void {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.errorMessage = ''; // Réinitialiser les messages d'erreur
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = ''; // Réinitialiser les messages d'erreur
    }
  }

  validateCurrentStep(): boolean {
    // Vérification des champs selon l'étape actuelle
    switch (this.currentStep) {
      case 1: // Informations de base
        if (!this.form.username || !this.form.email || !this.form.adresse || 
            !this.form.numeroIdentificationEntreprise || !this.form.telephone || !this.form.password) {
          this.errorMessage = "Veuillez remplir tous les champs obligatoires.";
          return false;
        }
        
        // Vérification du format de l'email
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(this.form.email)) {
          this.errorMessage = "Veuillez saisir une adresse email valide.";
          return false;
        }
        
        // Vérification du mot de passe
        if (this.form.password.length < 6) {
          this.errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
          return false;
        }
        
        return true;
      
      case 2: // Logo de l'entreprise
        // Cette étape est optionnelle, on peut la passer sans sélectionner un logo
        return true;
      
      case 3: // Critères écologiques
        if (!this.form.materiauxUtilises || !this.form.methodesProduction || 
            !this.form.programmeRecyclage || !this.form.transportLogistiqueVerte || 
            !this.form.initiativesSociales || !this.form.scoreEcologique) {
          this.errorMessage = "Veuillez remplir tous les critères écologiques.";
          return false;
        }
        
        // Vérification du score écologique
        if (this.form.scoreEcologique < 0 || this.form.scoreEcologique > 10) {
          this.errorMessage = "Le score écologique doit être compris entre 0 et 10.";
          return false;
        }
        
        return true;
      
      case 4: // Validation finale
        // Aucune validation nécessaire, la case à cocher est gérée par le bouton désactivé
        return true;
      
      default:
        return true;
    }
  }

  // Méthode pour obtenir le pourcentage de progression
  getProgressPercentage(): number {
    return ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
  }

  // Méthode pour afficher/masquer le mot de passe
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // Méthodes pour la gestion des photos
  getPhotos(): void {
    this.photoService.get().subscribe({
      next: (data) => {
        this.allPhoto = data;
        console.log('Photos récupérées:', this.allPhoto);
  
        // Si aucune photo n'a été nouvellement uploadée, récupérer tous les IDs des photos
        if (this.newlyUploadedPhotos.length === 0) {
          // Ajouter tous les IDs des photos de la base de données à photosToHide
          this.photosToHide = this.allPhoto.map(photo => photo.id);
          console.log('Tous les IDs des photos à masquer:', this.photosToHide);
        } else {
          // Mettre à jour la liste des photos après avoir uploadé des photos
          console.log('Photos nouvellement uploadées:', this.newlyUploadedPhotos);

          // Mettre à jour les photos à masquer
          console.log('IDs des photos à masquer:', this.photosToHide);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des photos:', err);
      }
    });
  }

  // File upload methods
  selectFiles(event: any): void {
    this.selectedFiles = event.target.files;
    this.currentFiles = Array.from(this.selectedFiles || []);
    this.progressInfos = this.currentFiles.map(file => ({ value: 0, fileName: file.name }));
    this.uploadMessage = '';
    this.uploadSuccess = false;
    this.uploadError = false;
  }

  uploadPhotos(): void {
    this.uploadMessage = '';
    this.uploadSuccess = false;
    this.uploadError = false;
    this.newlyUploadedPhotos = [];
    
    if (this.selectedFiles && this.selectedFiles.length > 0) {
      const uploadObservables = Array.from(this.selectedFiles).map((file, index) => {
        return this.uploadFile(file, index);
      });

      // Utiliser forkJoin pour attendre que tous les fichiers soient téléchargés
      forkJoin(uploadObservables).subscribe({
        next: (responses) => {
          this.uploadSuccess = true;
          this.uploadMessage = 'Toutes les photos ont été téléchargées avec succès.';
          // Rafraîchir la liste des photos pour inclure les nouvelles
          this.getPhotos();
          this.selectedFiles = undefined;
          this.currentFiles = [];
        },
        error: (err) => {
          this.uploadError = true;
          this.uploadMessage = 'Une erreur est survenue lors du téléchargement de certaines photos.';
        }
      });
    }
  }

  uploadFile(file: File, index: number): any {
    return new Promise((resolve, reject) => {
      this.uploadService.upload(file).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.progressInfos[index].value = Math.round(100 * event.loaded / event.total);
          } else if (event instanceof HttpResponse) {
            // Stocker uniquement les données essentielles pour identifier la photo plus tard
            const newPhoto: Photo = event.body;
            this.newlyUploadedPhotos.push({...newPhoto}); // Utiliser une copie pour éviter les références partagées
            
            // Remove the photo ID from photosToHide to make it visible
            const photoIndex = this.photosToHide.indexOf(newPhoto.id);
            if (photoIndex > -1) {
              this.photosToHide.splice(photoIndex, 1);
            }
            
            console.log('Photo uploadée:', newPhoto);
            resolve(event.body);
          }
        },
        error: (err: any) => {
          this.progressInfos[index].value = 0;
          this.uploadError = true;
          reject(err);
        }
      });
    });
  }

  // Helper method to check if a photo is selected (used in template)
  isPhotoSelected(photoId: number): boolean {
    return this.form.logo.id === photoId;
  }

  // Method to select a photo as logo
  selectLogo(photo: Photo): void {
    this.form.logo = {
      id: photo.id,
      name: photo.name,
      url: photo.url
    };
    this.cdr.detectChanges();
    console.log('Logo sélectionné:', this.form.logo);
  }

  onSubmit(): void {
    // Dernière vérification des champs obligatoires
    if (!this.form.username || !this.form.email || !this.form.password || !this.form.telephone|| 
        !this.form.adresse || !this.form.numeroIdentificationEntreprise || 
        !this.form.materiauxUtilises || !this.form.methodesProduction || 
        !this.form.programmeRecyclage || !this.form.transportLogistiqueVerte || 
        !this.form.initiativesSociales || !this.form.scoreEcologique) {
      this.errorMessage = "Tous les champs obligatoires doivent être remplis.";
      this.isRegisterFailed = true;
      return;
    }
    
    // Vérification de l'acceptation des conditions
    if (!this.acceptTerms) {
      this.errorMessage = "Vous devez accepter les règlements de la société pour vous inscrire.";
      this.isRegisterFailed = true;
      return;
    }

    const userData = {
      username: this.form.username,
      email: this.form.email,
      telephone: this.form.telephone,
      adresse: this.form.adresse,
      logo: this.form.logo,
      password: this.form.password,
      statut: 'EN_ATTENTE',
      numeroIdentificationEntreprise: this.form.numeroIdentificationEntreprise,
      materiauxUtilises: this.form.materiauxUtilises,
      methodesProduction: this.form.methodesProduction,
      programmeRecyclage: this.form.programmeRecyclage,
      transportLogistiqueVerte: this.form.transportLogistiqueVerte,
      initiativesSociales: this.form.initiativesSociales,
      scoreEcologique: this.form.scoreEcologique,
    };

    this.authService.registerFournisseur(
      userData.username, 
      userData.email, 
      userData.password,
      userData.adresse,
      userData.logo,
      userData.telephone,
      userData.numeroIdentificationEntreprise,
      userData.materiauxUtilises,
      userData.methodesProduction,
      userData.programmeRecyclage,
      userData.transportLogistiqueVerte,
      userData.initiativesSociales,
      userData.scoreEcologique
    ).subscribe({
      next: (data) => {
        console.log('Inscription réussie :', data);
        this.isSuccessful = true;
        this.isRegisterFailed = false;

        // Sauvegarde utilisateur (sans token car API ne le retourne pas)
        this.tokenStorage.saveUser(data);
      },
      error: (err) => {
        console.error('Erreur lors de l\'enregistrement :', err);
        this.errorMessage = err.error.message || 'Enregistrement échoué';
        this.isRegisterFailed = true;
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/fournisseur/login']);
  }

  goBack(): void {
    this.router.navigate(['/accueil']);
  }
  
}