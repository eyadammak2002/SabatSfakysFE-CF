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


  constructor(
    private fb: FormBuilder,
    private fournisseurService: ProfileService,
    private route: ActivatedRoute,
    private tokenStorage: TokenStorageService,

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
}