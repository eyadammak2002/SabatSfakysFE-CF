import { Component } from '@angular/core';
import {  Panier, PanierService } from '../services/panier.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-commande',
  templateUrl: './commande.component.html',
  styleUrls: ['./commande.component.css']
})
export class CommandeComponent {
  panier: Panier = { clientId: 0, lignesPanier: [], total: 0, statut: '', adresseLivraison: '' };  // Initialisation

  constructor(private panierService: PanierService, private router: Router) {}

  ngOnInit(): void {
    this.panier = this.panierService.getPanier();
    if (!this.panier || this.panier.statut !== 'EN_COURS') {
      // Si le panier n'est pas validé, rediriger vers la page panier
      this.router.navigate(['/panier']);
    }
  }

  // Méthode pour valider la commande
  validerCommande(): void {
    if (this.panier.lignesPanier.length === 0) {
      alert('Votre panier est vide !');
      return;
    }
    this.panier.statut = 'COMMANDEE'; 
    this.panierService.sauvegarderPanierDansLocalStorage();
    alert('Commande validée avec succès !');
  }


}
