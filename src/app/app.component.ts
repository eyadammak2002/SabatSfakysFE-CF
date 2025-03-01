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
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // ✅ Vérifie si l'utilisateur est sur une page de connexion ou d'inscription
        this.isLoginPage = event.url.includes('/auth/client/login') ||
                           event.url.includes('/auth/fournisseur/login') ||
                           event.url.includes('/auth/client/register') ||
                           event.url.includes('/auth/fournisseur/register');
      }
    });
  }
}
