import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginFournisseurComponent } from './login-fournisseur.component';

describe('LoginFournisseurComponent', () => {
  let component: LoginFournisseurComponent;
  let fixture: ComponentFixture<LoginFournisseurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginFournisseurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginFournisseurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
