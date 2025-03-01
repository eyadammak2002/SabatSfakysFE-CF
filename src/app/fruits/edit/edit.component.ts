import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Fruits } from '../fruits';
import { FruitsService } from '../fruits.service';
import { Category } from 'src/app/category/category';
import { CategoryService } from 'src/app/category/category.service';
declare var window: any;
@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styles: [
    'table { min-width: 600px }',
  ]
})
export class EditComponent {
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
  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute, 
    private router:Router,
    private fruitService: FruitsService
  ) {}
 
  ngOnInit(): void {
    this.get();

  }
  get() {
    this.categoryService.get().subscribe((data:Category[]) => {
      this.allCategory = data;
    console.log(data);
    });
    
    this.route.paramMap.subscribe((param) => {
      var id = Number(param.get('id'));
      this.getById(id);
    });
  }
 
  getById(id: number) {
    this.fruitService.getById(id).subscribe((data) => {
      this.fruitForm = data;
      console.log(data);
    });
  }
 
  update() {
    this.fruitService.update(this.fruitForm)
    .subscribe({
      next:(data) => {
        this.router.navigate(["/fruits/home"]);
      },
      error:(err) => {
        console.log(err);
      }
    })
  }
}


