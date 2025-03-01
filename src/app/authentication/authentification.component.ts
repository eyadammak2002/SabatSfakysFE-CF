import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
//import { LoginComponent } from '../authentication/login/login.component'; // ✅ Vérifie bien ce chemin

@Component({
  selector: 'app-authentification',
  templateUrl: './authentification.component.html',
  styleUrls: ['./authentification.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule,// LoginComponent

  ] // ✅ Importe LoginComponent ici
})
export class AuthenticationComponent { }
