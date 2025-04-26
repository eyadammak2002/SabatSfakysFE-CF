import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientReclamationListComponent } from './client-reclamation-list.component';

describe('ClientReclamationListComponent', () => {
  let component: ClientReclamationListComponent;
  let fixture: ComponentFixture<ClientReclamationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientReclamationListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientReclamationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
