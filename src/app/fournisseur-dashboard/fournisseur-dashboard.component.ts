import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TokenStorageService } from '../services/token-storage.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-fournisseur-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './fournisseur-dashboard.component.html',
  styleUrls: ['./fournisseur-dashboard.component.css']
})
export class FournisseurDashboardComponent implements OnInit {
  isSidebarExpanded = false;
  currentRoute: string = '';
  email: string = ''; // Définir la propriété email

  
  constructor(
    private router: Router,
    private tokenStorage: TokenStorageService
  ) {
    console.log("✅ FournisseurDashboardComponent chargé !");
    
    // S'abonner aux événements de navigation pour mettre à jour la route active
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
      console.log('Route active:', this.currentRoute);
    });
  }

  ngOnInit(): void {
    // Récupérer l'état sauvegardé du menu latéral
    const savedSidebarState = localStorage.getItem('sidebarState');
    if (savedSidebarState) {
      this.isSidebarExpanded = savedSidebarState === 'expanded';
    }
    
    // Vérifier si l'utilisateur est connecté
    if (!this.tokenStorage.getUser()) {
      this.router.navigate(['/login']);
    } else {
      // Stocker l'email de l'utilisateur
      const user = this.tokenStorage.getUser();
      this.email = user.email; // Assignez l'email à la propriété du composant
    }
  }

  toggleSidebar(): void {
    this.isSidebarExpanded = !this.isSidebarExpanded;
    // Sauvegarder l'état du menu pour la prochaine visite
    localStorage.setItem('sidebarState', this.isSidebarExpanded ? 'expanded' : 'collapsed');
  }

  // Méthode pour vérifier si une route est active
  isActive(route: string): boolean {
    // Comparaison simple pour le moment, à ajuster selon la structure de vos routes
    return this.currentRoute.startsWith(route);
  }

  // Méthode de déconnexion
  logout(): void {
    this.tokenStorage.signOut();
    this.router.navigate(['/auth/fournisseur/login']);
  }
}