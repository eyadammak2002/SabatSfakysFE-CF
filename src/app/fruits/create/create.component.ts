import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Fruits } from '../fruits';
import { FruitsService } from '../fruits.service';
import { CategoryService } from 'src/app/category/category.service';
import { Category } from 'src/app/category/category';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styles: [
    // todo: figure out how to make width dynamic
    'form { display: flex; flex-direction: column; min-width: 700px; }',
    'form > * { width: 100% }'
  ]
})
export class CreateComponent implements OnInit {
  allCategory: Category[] = [];
  fruitForm: Fruits = {
    id: 0,
    name: '',
    price: 0,
    quantity: 0,
   category:{
    id: 0,
    name: '',
    description: ''
  }
  };
 
  constructor(private fruitService:FruitsService,
    private categoryService: CategoryService,
    private router:Router) {}
    
 
  ngOnInit(): void {
    this.get();

  }
  get() {
    this.categoryService.get().subscribe((data) => {
      console.log("data=",data)
      this.allCategory = data;
    });
  }
 
  save(){
    this.fruitService.create(this.fruitForm)
    .subscribe({
      next:(data) => {
        this.router.navigate(["/fruits/home"])
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