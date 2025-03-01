import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Category } from '../category';
import { CategoryService } from '../category.service';
@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css']
})
export class EditComponent {
  categoryForm: Category = {
    id: 0,
    name: '',
    description: ''
  };
  constructor(
    private route: ActivatedRoute,
    private router:Router,
    private categoryService: CategoryService
  ) {}
 
  ngOnInit(): void {
    this.route.paramMap.subscribe((param) => {
      var id = Number(param.get('id'));
      this.getById(id);
    });
  }
 
  getById(id: number) {
    this.categoryService.getById(id).subscribe((data) => {
      this.categoryForm = data;
    });
  }
 
  update() {
    this.categoryService.update(this.categoryForm)
    .subscribe({
      next:(data) => {
        this.router.navigate(["/category/home"]);
      },
      error:(err) => {
        console.log(err);
      }
    })
  }
  cancel() {
    this.router.navigate(["/fruits/home"]);
  }
}

