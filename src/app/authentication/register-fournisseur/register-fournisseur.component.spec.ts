import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterFournisseurComponent } from './register-fournisseur.component';

describe('RegisterFournisseurComponent', () => {
  let component: RegisterFournisseurComponent;
  let fixture: ComponentFixture<RegisterFournisseurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterFournisseurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterFournisseurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
