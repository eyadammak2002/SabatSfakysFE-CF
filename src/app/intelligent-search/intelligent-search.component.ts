// intelligent-search.component.ts
import { Component, OnInit } from '@angular/core';
import { SearchService, SearchResponse } from '../services/search.service';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-intelligent-search',
  templateUrl: './intelligent-search.component.html',
  styleUrls: ['./intelligent-search.component.css']
})
export class IntelligentSearchComponent implements OnInit {
  searchQuery: string = '';
  searchResults: any[] = [];
  aiResponse: string = '';
  isLoading: boolean = false;
  showResults: boolean = false;
  
  private searchTerms = new Subject<string>();

  constructor(
    private searchService: SearchService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.performSearch(term);
    });
  }

  // Gestion de la saisie de l'utilisateur
  onSearchInput(event: any): void {
    const term = event.target.value.trim();
    this.searchQuery = term;
    
    if (term) {
      this.searchTerms.next(term);
    } else {
      this.searchResults = [];
      this.aiResponse = '';
      this.showResults = false;
    }
  }

  // Lancer la recherche intelligente
  performSearch(term: string): void {
    if (!term.trim()) return;
    
    this.isLoading = true;
    this.searchService.naturalLanguageSearch(term).subscribe({
      next: (response: SearchResponse) => {
        this.searchResults = response.products ? response.products : [];
        this.aiResponse = response.message;
        this.showResults = true;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la recherche:', error);
        this.aiResponse = 'Une erreur est survenue lors de la recherche.';
        this.isLoading = false;
      }
    });
  }

  // Recherche standard par mot-clé (sans IA)
  performStandardSearch(): void {
    if (!this.searchQuery.trim()) return;
    
    this.isLoading = true;
    this.searchService.searchByKeyword(this.searchQuery).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.aiResponse = `Résultats pour: "${this.searchQuery}"`;
        this.showResults = true;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la recherche standard:', error);
        this.isLoading = false;
      }
    });
  }

  // Navigation vers la page de détail d'un produit
  viewProductDetails(product: any): void {
    this.router.navigate(['/article', product.productId]);
    this.resetSearch();
  }

  // Réinitialisation de la recherche
  resetSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.aiResponse = '';
    this.showResults = false;
  }
}