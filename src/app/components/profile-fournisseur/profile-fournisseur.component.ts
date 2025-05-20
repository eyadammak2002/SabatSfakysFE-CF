import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProfileService } from '../profile/profile.service';
import { Fournisseur } from 'src/app/pack/Fournisseur';
import { TokenStorageService } from 'src/app/services/token-storage.service';

@Component({
  selector: 'app-profile-fournisseur',
  templateUrl: './profile-fournisseur.component.html',
  styleUrls: ['./profile-fournisseur.component.css']
})
export class ProfileFournisseurComponent implements OnInit {
  profileForm: FormGroup;
  fournisseur: Fournisseur | null = null;
  fournisseurId: number = 0;
  loading = false;
  isEditing = false;
  errorMessage = '';
  successMessage = '';

// Dans ProfileComponent, ajoutez ces propriétés
  showDeleteConfirmation = false;
  deletePassword = '';

  constructor(
    private fb: FormBuilder,
    private fournisseurService: ProfileService,
    private route: ActivatedRoute,
    private tokenStorage: TokenStorageService,
    private tokenStorageService: TokenStorageService


  ) {
    // Initialiser le formulaire
    this.profileForm = this.fb.group({
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      adresse: [''],
      telephone: [''],
      sexe: ['']
    });
  }

  ngOnInit(): void {
    // Essayer d'abord les paramètres d'URL
    this.route.queryParams.subscribe(params => {
      const email = params['email'];
      if (email) {
        this.fetchFournisseurDataByEmail(email);
      } else {
        const user = this.tokenStorage.getUser();
        const email = user.email;
        this.fetchFournisseurDataByEmail(email);

      }
    });
  }
  

  fetchFournisseurDataByEmail(email: string): void {
    this.loading = true;
    this.fournisseurService.getFournisseurByEmail(email).subscribe(
      (data: Fournisseur) => {
        this.fournisseur = data;
        console.log("this.fournisseur",this.fournisseur);
        this.fournisseurId = data.id;
        this.profileForm.patchValue({
          nom: data.nom,
          email: data.email,
          adresse: data.adresse,
          telephone: data.telephone
        });
        this.loading = false;
      },
      error => {
        this.errorMessage = 'Erreur lors du chargement des données du profil';
        console.error(error);
        this.loading = false;
      }
    );
  }
  

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onSubmit(): void {
    if (this.profileForm.invalid || !this.fournisseur) {
      return;
    }

    this.loading = true;
    const updatedFournisseur = {
      ...this.fournisseur,
      ...this.profileForm.value
    };

    this.fournisseurService.updateFournisseur(this.fournisseurId, updatedFournisseur).subscribe(
      (response: Fournisseur) => {
        this.fournisseur = response;
        this.successMessage = 'Profil mis à jour avec succès';
        this.isEditing = false;
        this.loading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error => {
        this.errorMessage = 'Erreur lors de la mise à jour du profil';
        console.error(error);
        this.loading = false;
      }
    );
  }

  // Ajoutez ces méthodes
toggleDeleteConfirmation(): void {
  this.showDeleteConfirmation = !this.showDeleteConfirmation;
  this.errorMessage = '';
  this.successMessage = '';
}

confirmDeleteAccount(): void {
  if (!this.deletePassword) {
    this.errorMessage = 'Veuillez entrer votre mot de passe';
    window.alert('Veuillez entrer votre mot de passe');
    return;
  }

  this.loading = true;
  this.fournisseurService.deleteAccount(this.deletePassword).subscribe(
    response => {
      this.successMessage = 'Votre compte a été supprimé avec succès';
      window.alert('Votre compte a été supprimé avec succès');
      this.loading = false;
      this.tokenStorageService.signOut(); // Méthode pour effacer le token et autres données de session
      
      setTimeout(() => {
        window.location.href = '/accueil'; // Redirection simple
      }, 2000);
    },
    error => {
      this.loading = false;
      
      // Message pour l'alerte native (texte brut)
      let alertMessage = '';
      
      // Récupérer et afficher le message d'erreur détaillé du backend
      if (error.error && error.error.message) {
        // Message pour l'alerte native
        alertMessage = error.error.message;
        
        // Pour l'affichage dans la page
        if (error.error.message.includes("\n")) {
          // Convertir les sauts de ligne en balises <br> pour l'affichage HTML
          this.errorMessage = error.error.message.replace(/\n/g, '<br>');
          // Marquer ce message comme HTML pour éviter l'échappement par Angular
          setTimeout(() => {
            const errorElement = document.querySelector('.alert.alert-danger');
            if (errorElement) {
              errorElement.innerHTML = this.errorMessage;
            }
          }, 0);
        } else {
          // Message simple sans formatage
          this.errorMessage = error.error.message;
        }
      } else if (error.status === 401) {
        this.errorMessage = 'Mot de passe incorrect';
        alertMessage = 'Mot de passe incorrect';
      } else if (error.status === 409) {
        // Conflit - généralement utilisé pour les contraintes métier
        this.errorMessage = 'Impossible de supprimer le compte en raison de contraintes liées à vos données';
        alertMessage = 'Impossible de supprimer le compte en raison de contraintes liées à vos données';
      } else {
        this.errorMessage = 'Une erreur s\'est produite lors de la suppression du compte';
      }
      
      // Gérer le cas particulier où l'utilisateur est supprimé mais une erreur se produit après
      if (error.error && error.error.message && error.error.message.includes("User Not Found")) {
        this.successMessage = 'Votre compte a été supprimé avec succès';
        alertMessage = 'Votre compte a été supprimé avec succès';
        this.errorMessage = '';
        this.tokenStorageService.signOut();
        setTimeout(() => {
          window.location.href = '/accueil';
        }, 2000);
      } else {
        // Afficher l'alerte native avec le message d'erreur
        window.alert(alertMessage);
      }
      
      console.error('Erreur:', error);
    }
  );
}
}