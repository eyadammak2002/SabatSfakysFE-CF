// profile.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Client, ProfileService } from './profile.service';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from 'src/app/app-routing.module';

@Component({
  selector: 'app-profile',
  
  standalone: true,
  imports: [
    BrowserModule,
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


  constructor(
    private fb: FormBuilder,
    private clientService: ProfileService,
    private route: ActivatedRoute
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
}