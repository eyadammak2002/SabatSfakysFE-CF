import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TokenStorageService } from 'src/app/services/token-storage.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})

  export class HeaderComponent implements OnInit {
    isLoggedIn = false;
    roles: string[] = [];
    username?: string;
    showAdminBoard = false;
    showModeratorBoard = false;
  
    constructor(private tokenStorageService: TokenStorageService, private router: Router) {}
  
    ngOnInit(): void {
      // Vérifier si l'utilisateur est connecté
      this.isLoggedIn = !!this.tokenStorageService.getToken();
  
      if (this.isLoggedIn) {
        const user = this.tokenStorageService.getUser();
        console.log('User Data:', user); // Vérifier les données de l'utilisateur
    
        
        console.log('Roles:', this.roles);
        console.log('Username:', this.username);
      }
    }
  
    logout(): void {
      this.tokenStorageService.signOut();
      this.isLoggedIn = false;
      this.router.navigate(['/auth/login']); // Redirige proprement après déconnexion
    }
  }
  