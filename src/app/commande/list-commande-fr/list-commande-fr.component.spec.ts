import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListCommandeFRComponent } from './list-commande-fr.component';

describe('ListCommandeFRComponent', () => {
  let component: ListCommandeFRComponent;
  let fixture: ComponentFixture<ListCommandeFRComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListCommandeFRComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListCommandeFRComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
