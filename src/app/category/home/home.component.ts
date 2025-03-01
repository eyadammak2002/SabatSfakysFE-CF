import { Component, OnInit } from '@angular/core';
import { Category } from '../category';
import { CategoryService } from '../category.service';
declare var window: any;
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})



export class HomeComponent {
  displayedColumns = ['id', 'Name', 'Description'];
  selectedCategory!: Category;
  allCategory: Category[] = [];
  feedback: any = {};
  deleteModal: any;
  idTodelete: number = 0;
  constructor(private categoryService: CategoryService) {}
 
  ngOnInit(): void {
    this.getAllCategory();
  }
 
  getAllCategory() {
    this.categoryService.get().subscribe((data:Category[]) => {
      this.allCategory= data;
      console.log("allFruits : ", this.allCategory);
    });
  }
  openDeleteModal(id: number) {
    this.idTodelete = id;
    this.deleteModal.show();
  }
 
  select(selected: Category): void {
    this.selectedCategory = selected;
  }


  delete(item: Category): void {
    if (confirm('Are you sure?')) {
      this.categoryService.delete(item.id).subscribe({
        next: () => {
          this.allCategory = this.allCategory.filter(allCategory => allCategory.id !== item.id);
          this.feedback = { type: 'success', message: 'Delete was successful!' };
          setTimeout(() => {
            this.feedback = null;
          }, 3000);
        },
        error: (err) => {
          this.feedback = { type: 'warning', message: 'Error deleting.' };
          console.log(err);
        }
      });
    }
  }

  /*delete() {
    this.categoryService.delete(this.idTodelete).subscribe({
      next: (data) => {
        this.allCategory = this.allCategory.filter(_ => _.id != this.idTodelete)
        this.deleteModal.hide();
      },
    });
  }*/
}


