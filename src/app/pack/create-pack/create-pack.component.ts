import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Article } from 'src/app/article/article';
import { Pack } from '../pack';
import { PacksService } from '../packs.service';
import { ArticleService } from 'src/app/article/article.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-pack',
  templateUrl: './create-pack.component.html',
  standalone: true,
  imports: [FormsModule, CommonModule],
  styleUrls: ['./create-pack.component.css']
})
export class CreatePackComponent implements OnInit {
  packForm: Pack = {
    name: '',
    articles: []  // Removed `fournisseurId`
  };

  allArticles: Article[] = [];

  constructor(
    private packsService: PacksService,
    private articleService: ArticleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log("🔄 Initializing Create Pack Component...");
    this.fetchArticles();
  }

  // ✅ Fetch all available articles
  fetchArticles(): void {
    this.articleService.get().subscribe(
      (data) => this.allArticles = data,
      (error) => console.error("❌ Error fetching articles", error)
    );
  }

  // ✅ Toggle article selection
  toggleArticleSelection(article: Article): void {
    const index = this.packForm.articles.findIndex(a => a.id === article.id);
    if (index > -1) {
      this.packForm.articles.splice(index, 1);
    } else {
      this.packForm.articles.push(article);
    }
  }

  savePack(): void {
    console.log("📦 Creating pack:", this.packForm);
    this.packsService.create(this.packForm).subscribe(
      (data) => {
        console.log("✅ Pack Created:", data);
        this.router.navigate(['/pack']);
      },
      (error) => console.error("Error creating pack:", error)
    );
  }
  
  redirectToPacks(): void {
    this.router.navigate(['/pack']);
  }

  
}
