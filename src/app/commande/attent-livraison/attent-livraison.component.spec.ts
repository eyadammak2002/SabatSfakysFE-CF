import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttentLivraisonComponent } from './attent-livraison.component';

describe('AttentLivraisonComponent', () => {
  let component: AttentLivraisonComponent;
  let fixture: ComponentFixture<AttentLivraisonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AttentLivraisonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttentLivraisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
