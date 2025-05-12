// revenus-fournisseur.component.ts
// Convertir le composant standalone en composant normal
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { RevenusFournisseurService } from 'src/app/services/revenus-fournisseur.service';

@Component({
  selector: 'app-revenus-fournisseur',
  standalone:true,
  imports:[FormsModule,CommonModule],
  templateUrl: './revenus-fournisseur.component.html',
  styleUrls: ['./revenus-fournisseur.component.css']
})

export class RevenusFournisseurComponent implements OnInit {
  // Données de revenus
  revenuData: any = null;
  articlesRevenus: any[] = [];
  loading: boolean = false;
  
  // Filtre de recherche
  searchTerm: string = '';
  
  constructor(
    private revenusFournisseurService: RevenusFournisseurService
  ) { }

  ngOnInit(): void {
    this.loadRevenusData();
  }

  /**
   * Charge les données de revenus depuis l'API
   */
  loadRevenusData(): void {
    this.loading = true;
    
    this.revenusFournisseurService.getRevenusFournisseur().subscribe(
      (data) => {
        this.loading = false;
        this.revenuData = data;
        
        if (data && data.revenus) {
          this.articlesRevenus = data.revenus;
        }
      },
      (error) => {
        this.loading = false;
        console.error('Erreur de chargement des revenus:', error);
        alert('Erreur lors du chargement des revenus. Veuillez réessayer ultérieurement.');
      }
    );
  }

  /**
   * Filtre les articles par nom
   */
  get filteredArticles(): any[] {
    if (!this.searchTerm?.trim()) {
      return this.articlesRevenus;
    }
    
    const term = this.searchTerm.toLowerCase().trim();
    return this.articlesRevenus.filter(article => 
      article.nomArticle.toLowerCase().includes(term) || 
      article.refArticle.toLowerCase().includes(term)
    );
  }

  /**
   * Formatte un montant en devise
   */
  formatCurrency(amount: number): string {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('fr-TN', { 
      style: 'currency', 
      currency: 'TND'
    }).format(amount);
  }
}