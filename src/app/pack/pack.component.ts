import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Pack } from './pack';
import { PacksService } from './packs.service';

@Component({
  selector: 'app-pack',
  standalone: true,
  imports: [FormsModule, CommonModule, CommonModule],
  templateUrl: './pack.component.html',
  styleUrls: ['./pack.component.scss']

})
export class PackComponent implements OnInit {
  displayedColumns = ['id', 'name', 'fournisseurId', 'articles', 'actions']; 
  selectedPack!: Pack;
  allPacks: Pack[] = [];
  feedback: any = {};
  deleteModal: any;
  idToDelete: number = 0;

  constructor(private packsService: PacksService, private router: Router) {}

  ngOnInit(): void {
    this.getAllPacks();
  }


  getAllPacks() {
    this.packsService.getAll().subscribe((data: Pack[]) => {
      this.allPacks = data;
      console.log("All Packs:", this.allPacks);
    });
  }


  openDeleteModal(id: number) {
    this.idToDelete = id;
    this.deleteModal.show();
  }


  select(selected: Pack): void {
    this.selectedPack = selected;
  }


  delete(pack: Pack): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce pack ?')) {
      this.packsService.delete(pack.id!).subscribe({
        next: () => {
          this.allPacks = this.allPacks.filter(p => p.id !== pack.id);
          this.feedback = { type: 'success', message: 'Le pack a été supprimé avec succès !' };
          setTimeout(() => this.feedback = null, 3000);
        },
        error: (err) => {
          this.feedback = { type: 'warning', message: 'Erreur lors de la suppression du pack.' };
          console.error('Error deleting pack:', err);
        }
      });
    }
  }


  getEditPackUrl(id: number): string {
    return `/editPack/${id}`;
  }


  redirectToCreatePack() {
    this.router.navigate(['createPack']);
  }


  redirectToPack(): void {
    this.router.navigate(['packs']);
  }


  navigateToEditPack(packId: number): void {
    this.router.navigate(['/editPack', packId]);
  }
}
