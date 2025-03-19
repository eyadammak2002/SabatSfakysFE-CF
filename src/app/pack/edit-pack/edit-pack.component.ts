import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Pack } from '../pack';
import { PacksService } from '../packs.service';
import { Article } from 'src/app/article/article';
import { ArticleService } from 'src/app/article/article.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-pack',
  templateUrl: './edit-pack.component.html',
  standalone: true,
  imports: [FormsModule, CommonModule],
  styleUrls: ['./edit-pack.component.css']
})
export class EditPackComponent implements OnInit {
  packForm: Pack = {
    id: 0,
    name: '',
    articles: []
  };

  allArticles: Article[] = [];
  selectedArticles: Article[] = [];

  constructor(
    private packsService: PacksService,
    private articleService: ArticleService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.log("🔄 Loading Edit Pack Component...");
    this.getAllArticles();
    this.loadPack();
  }

  // ✅ Fetch all available articles
  getAllArticles(): void {
    this.articleService.get().subscribe({
      next: (data) => {
        this.allArticles = data;
        console.log("📜 Articles available:", this.allArticles);
      },
      error: (err) => console.error("❌ Error fetching articles:", err)
    });
  }

  // ✅ Load the existing pack
  loadPack(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    console.log("🆔 Pack ID to edit:", id);

    if (!id) {
      console.error("❌ No pack ID found!");
      return;
    }

    this.packsService.getById(id).subscribe({
      next: (data) => {
        this.packForm = data;
        // this.packForm.fournisseurId = data.fournisseurId;  // ❌ Removed `fournisseurId`
        this.selectedArticles = data.articles || [];
        console.log("📦 Pack data loaded:", this.packForm);
      },
      error: (err) => console.error("❌ Error fetching pack:", err)
    });
  }

  // ✅ Check if an article is selected
  isArticleSelected(article: Article): boolean {
    return this.selectedArticles.some(a => a.id === article.id);
  }

  // ✅ Handle article selection
  toggleArticleSelection(article: Article): void {
    const index = this.selectedArticles.findIndex(a => a.id === article.id);
    if (index > -1) {
      this.selectedArticles.splice(index, 1);
    } else {
      this.selectedArticles.push(article);
    }
    this.packForm.articles = [...this.selectedArticles];
    console.log("✅ Selected articles updated:", this.selectedArticles);
  }

  // ✅ Update the pack
  update(): void {
    console.log("🔄 Updating pack...", this.packForm);

    this.packsService.update(this.packForm.id!, this.packForm)
      .subscribe({
        next: () => {
          console.log("✅ Pack successfully updated!");
          this.router.navigate(['/pack']);
        },
        error: (err) => console.error("❌ Error updating pack:", err)
      });
  }

  // ✅ Redirect to pack list
  redirectToPacks(): void {
    this.router.navigate(['/pack']);
  }
}
