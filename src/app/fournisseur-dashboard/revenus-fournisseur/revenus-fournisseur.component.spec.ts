import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevenusFournisseurComponent } from './revenus-fournisseur.component';

describe('RevenusFournisseurComponent', () => {
  let component: RevenusFournisseurComponent;
  let fixture: ComponentFixture<RevenusFournisseurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RevenusFournisseurComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevenusFournisseurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
