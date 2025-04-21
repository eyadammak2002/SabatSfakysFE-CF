import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileFournisseurComponent } from './profile-fournisseur.component';

describe('ProfileFournisseurComponent', () => {
  let component: ProfileFournisseurComponent;
  let fixture: ComponentFixture<ProfileFournisseurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProfileFournisseurComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileFournisseurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
