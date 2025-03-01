import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Category } from '../category';
import { CategoryService } from '../category.service';
@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styles: [
    // todo: figure out how to make width dynamic
    'form { display: flex; flex-direction: column; min-width: 700px; }',
    'form > * { width: 100% }'
  ]
})
export class CreateComponent {
  categoryForm: Category = {
    id: 0,
    name: '',
    description: '',
  };
  constructor(private categoryService:CategoryService,
    private router:Router) {}
 
  ngOnInit(): void {
   
  }
  save(){
    this.categoryService.create(this.categoryForm)
    .subscribe({
      next:(data) => {
        this.router.navigate(["/category/home"])
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

