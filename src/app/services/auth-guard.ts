import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TokenStorageService } from './token-storage.service';
import { PanierService } from './panier.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private tokenStorage: TokenStorageService,
    private panierService: PanierService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = this.tokenStorage.getUser();
    
    if (user && user.id) {
      // L'utilisateur est connecté, autoriser l'accès
      return true;
    }

    // L'utilisateur n'est pas connecté, sauvegarder le panier invité
    this.panierService.sauvegarderPanierDansLocalStorage();
    
    // Rediriger vers la page de connexion avec l'URL de retour
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url }
    });
    
    return false;
  }
}