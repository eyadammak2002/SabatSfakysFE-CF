// profile.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Client, ProfileService } from './profile.service';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from 'src/app/app-routing.module';
import { TokenStorageService } from 'src/app/services/token-storage.service';

@Component({
  selector: 'app-profile',
  
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule, 
    FormsModule, 
    CommonModule 
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  client: Client | null = null;
  clientId: number = 0;
  loading = false;
  isEditing = false;
  errorMessage = '';
  successMessage = '';

// Dans ProfileComponent, ajoutez ces propriétés
  showDeleteConfirmation = false;
  deletePassword = '';


  constructor(
    private fb: FormBuilder,
    private clientService: ProfileService,
    private route: ActivatedRoute,
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
    this.route.queryParams.subscribe(params => {
      const email = params['email'];
      if (email) {
        this.fetchClientDataByEmail(email);
      }
    });
  }
  

  fetchClientDataByEmail(email: string): void {
    this.loading = true;
    this.clientService.getClientByEmail(email).subscribe(
      (data: Client) => {
        this.client = data;
        this.clientId = data.id;
        this.profileForm.patchValue({
          nom: data.nom,
          email: data.email,
          adresse: data.adresse,
          telephone: data.telephone,
          sexe: data.sexe
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
    if (this.profileForm.invalid || !this.client) {
      return;
    }

    this.loading = true;
    const updatedClient = {
      ...this.client,
      ...this.profileForm.value
    };

    this.clientService.updateClient(this.clientId, updatedClient).subscribe(
      (response: Client) => {
        this.client = response;
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
    return;
  }

  this.loading = true;
  this.clientService.deleteAccount(this.deletePassword).subscribe(
    response => {
      this.successMessage = 'Votre compte a été supprimé avec succès';
      this.loading = false;
      this.tokenStorageService.signOut(); // Méthode pour effacer le token et autres données de session

      setTimeout(() => {
        // Supposons que vous ayez un service d'authentification avec une méthode logout
        // this.authService.logout(); 
        window.location.href = '/accueil'; // Redirection simple
      }, 2000);
    },
    error => {
      if (error.error && error.error.message && error.error.message.includes("User Not Found")) {
        this.successMessage = 'Votre compte a été supprimé avec succès';
        this.tokenStorageService.signOut();
        setTimeout(() => {
          window.location.href = '/accueil';
        }, 2000);
      } else {
        // Autres types d'erreurs
        if (error.status === 401) {
          this.errorMessage = 'Mot de passe incorrect';
        } else {
          this.errorMessage = 'Une erreur s\'est produite lors de la suppression du compte';
        }
      }
      console.error(error);
      this.loading = false;
    }
  );
}
}