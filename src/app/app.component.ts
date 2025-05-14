import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'SabatSfakys';

  isLoginPage: boolean = false;
  hideFooter: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;

        // ✅ Vérifie si l'utilisateur est sur une page de connexion ou d'inscription
        this.isLoginPage = url.includes('/auth/client/login') ||
                           url.includes('/auth/fournisseur/login') ||
                           url.includes('/auth/client/register') ||
                           url.includes('/auth/fournisseur/register');

        // ✅ Cacher le footer pour toutes les routes enfants du fournisseur dashboard
        this.hideFooter = this.isFournisseurDashboardRoute(url);
        //this.hideFooter = !url.includes('/accueil') && this.isFournisseurDashboardRoute(url);

      }
    });
  }

  // Méthode pour vérifier si on est dans les routes enfants de FournisseurDashboard
  private isFournisseurDashboardRoute(url: string): boolean {
    // Extrait le chemin de base sans les paramètres de requête
    const basePath = url.split('?')[0];
    
    return basePath === '/' ||
           basePath.includes('/articles') ||
           basePath.includes('/createArticle') ||
           basePath.includes('/editArticle') ||
           basePath.includes('/listCommandeFR') ||
           basePath.includes('/fournisseur/listReclamation') ||
           basePath.includes('/fournisseur/listAvis') ||
           basePath.includes('/fournisseur/articles-personalises') ||
           basePath.includes('/categories') ||
           basePath.includes('/settings') ||
           basePath.includes('/profileFR')|| 
           basePath.includes('/attentLivraison')|| 
           basePath.includes('/Listfavoris')|| 
           basePath.includes('/createArticle'); 
           
  }
}