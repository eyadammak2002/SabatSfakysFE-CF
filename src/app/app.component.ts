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
      }
    });
  }

  // Méthode pour vérifier si on est dans les routes enfants de FournisseurDashboard
  private isFournisseurDashboardRoute(url: string): boolean {
    return url === '/' ||
           url.includes('/articles') ||
           url.includes('/createArticle') ||
           url.includes('/editArticle') ||
           url.includes('/listCommandeFR') ||
           url.includes('/fournisseur/listReclamation') ||
           url.includes('/fournisseur/listAvis') ||
           url.includes('/fournisseur/articles-personalises') ||
           url.includes('/categories') ||
           url.includes('/settings');
  }
}
