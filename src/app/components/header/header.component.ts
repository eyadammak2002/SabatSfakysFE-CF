import { Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { TokenStorageService } from 'src/app/services/token-storage.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})

  export class HeaderComponent implements OnInit {
    showFournisseurDashboard = false;

    isLoggedIn = false;
    role: string = '';
    username?: string;
    showAdminBoard = false;
    showModeratorBoard = false;
  
    constructor(private tokenStorageService: TokenStorageService, private router: Router,
      private renderer: Renderer2, private el: ElementRef
    ) {}
  
    ngOnInit(): void {
      this.isLoggedIn = !!this.tokenStorageService.getToken();
    
      if (this.isLoggedIn) {
        const user = this.tokenStorageService.getUser();
        console.log('User Data:', user); // Vérifier les données de l'utilisateur
    
        // ✅ Stocker directement le rôle comme une chaîne
        this.role = user.role || '';
    
        console.log('Role:', this.role); // Vérifier que le rôle est bien récupéré
        console.log('Username:', user.username);
    
        // ✅ Vérifier si l'utilisateur est un fournisseur
        this.showFournisseurDashboard = this.role === 'ROLE_FOURNISSEUR';
      }
    
      this.updateProfileIcon();
    }
    

    updateProfileIcon() {
      const profileIcon = this.el.nativeElement.querySelector('.profile-icon');
      
      // Ajouter ou supprimer la classe 'affichageIcon' en fonction de l'état de connexion
      if (this.isLoggedIn) {
        this.renderer.addClass(profileIcon, 'affichageIcon');  // Afficher l'icône
      } else {
        this.renderer.removeClass(profileIcon, 'affichageIcon');  // Cacher l'icône
      }
    }
  
  
    logout(): void {
      this.tokenStorageService.signOut();
      this.isLoggedIn = false;
      this.router.navigate(['/auth/login']); // Redirige proprement après déconnexion
    }
  }
  