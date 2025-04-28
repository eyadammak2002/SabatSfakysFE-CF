import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FournisseurArticlesPersonalisesComponent } from './fournisseur-articles-personalises.component';

describe('FournisseurArticlesPersonalisesComponent', () => {
  let component: FournisseurArticlesPersonalisesComponent;
  let fixture: ComponentFixture<FournisseurArticlesPersonalisesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FournisseurArticlesPersonalisesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FournisseurArticlesPersonalisesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
