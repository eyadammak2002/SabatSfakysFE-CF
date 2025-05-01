import { CommonModule, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Panier, PanierService } from 'src/app/services/panier.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';

@Component({
  selector: 'app-list-commande',
  standalone: true,
  imports: [FormsModule, CommonModule, NgClass],
  templateUrl: './list-commande.component.html',
  styleUrls: ['./list-commande.component.css']
})
export class ListCommandeComponent implements OnInit {
  commandes: Panier[] = [];
  userId!: number;

  constructor(
    private panierService: PanierService,
    private tokenStorage: TokenStorageService
  ) {}

  ngOnInit(): void {
    const user = this.tokenStorage.getUser();
    this.userId = user.id;
    this.getCommandes();
  }

  getCommandes(): void {
    this.panierService.getCommandesByUser(this.userId).subscribe({
      next: (data) => {
        this.commandes = data;
  
        // Parcours chaque lignePanier pour récupérer son article
        this.commandes.forEach((commande) => {
          commande.lignesPanier.forEach((ligne) => {
            this.panierService.getArticleFromLignePanier(ligne.id).subscribe({
              next: (article) => {
                ligne.article = article;
              },
              error: (err) => {
                console.error(`Erreur lors de la récupération de l'article pour la ligne ${ligne.id}`, err);
              }
            });
          });
        });
  
        console.log('Commandes reçues :', this.commandes);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des commandes : ', err);
      }
    });
  }
  


 
  
}